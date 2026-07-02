"""
Coordinator Agent — Orchestrates all agents in a sequential pipeline.

This is the single entry point for the multi-agent system.
No frontend component directly calls any agent — only the Coordinator
communicates with agents.

Pipeline: Profile Agent → Career Agent → Coach Agent

Each agent writes its output to the shared session state via output_key,
and the next agent reads from it (via {placeholder} template variables).

IMPORTANT: The initial session state must be seeded with:
  - resume_text   → consumed by ProfileIntelligenceAgent instruction
  - target_role   → consumed by CareerIntelligenceAgent instruction
  - job_description → consumed by CareerIntelligenceAgent instruction
"""

import json
import logging
from typing import Any

from google.adk.agents import SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from backend.agents.profile_agent import create_profile_agent
from backend.agents.career_agent import create_career_agent
from backend.agents.coach_agent import create_coach_agent

logger = logging.getLogger(__name__)

APP_NAME = "PlacementPilotAI"
USER_ID = "placement_user"


def create_coordinator(role_id: str = "", job_description: str = "") -> SequentialAgent:
    """
    Create the Coordinator Agent that orchestrates the full analysis pipeline.

    The pipeline runs three agents in sequence:
    1. Profile Intelligence Agent — Parses the resume (reads {resume_text} from state)
    2. Career Intelligence Agent — Analyzes career fit using embedded role knowledge
    3. Career Coach Agent — Generates preparation roadmap (reads {profile_data}, {career_analysis} from state)

    Args:
        role_id: The target role ID used to pre-load career knowledge into the Career Agent.
        job_description: Optional job description passed to the Career Agent instruction.

    Returns:
        A SequentialAgent that orchestrates all sub-agents.
    """
    profile_agent = create_profile_agent()
    # Pass role_id so the Career Agent can embed role knowledge directly —
    # avoids using MCPToolset stdio subprocess which fails silently in reloader chains.
    career_agent = create_career_agent(role_id=role_id, job_description=job_description)
    coach_agent = create_coach_agent()

    coordinator = SequentialAgent(
        name="PlacementPilotCoordinator",
        description=(
            "Orchestrates the PlacementPilot AI analysis pipeline: "
            "resume parsing → career analysis → coaching plan."
        ),
        sub_agents=[profile_agent, career_agent, coach_agent],
    )

    return coordinator


async def run_analysis(
    resume_text: str,
    target_role: str,
    job_description: str = "",
) -> dict[str, Any]:
    """
    Run the full analysis pipeline through the Coordinator.

    Args:
        resume_text: The extracted text from the uploaded resume.
        target_role: The target role ID (e.g., 'software_engineer').
        job_description: Optional job description for ATS matching.

    Returns:
        A dictionary containing profile_data, career_analysis, and coaching_plan.
    """
    logger.info(f"Starting analysis pipeline for role: {target_role}")

    # Create the coordinator and session service.
    # Pass role_id so the Career Agent embeds role knowledge in its instruction.
    coordinator = create_coordinator(role_id=target_role, job_description=job_description)
    session_service = InMemorySessionService()

    runner = Runner(
        agent=coordinator,
        app_name=APP_NAME,
        session_service=session_service,
    )

    # ── KEY FIX ──────────────────────────────────────────────────────────────
    # Seed the session state with all context variables that agent instruction
    # templates reference via {placeholder} syntax. Without this, ADK raises
    # KeyError before any LLM call is made.
    #
    # - {resume_text}      → read by ProfileIntelligenceAgent
    # - {target_role}      → read by CareerIntelligenceAgent
    # - {job_description}  → read by CareerIntelligenceAgent
    # - {profile_data}     → written by ProfileIntelligenceAgent (output_key),
    #                        then read by CareerIntelligenceAgent + CoachAgent
    # - {career_analysis}  → written by CareerIntelligenceAgent (output_key),
    #                        then read by CoachAgent
    # ─────────────────────────────────────────────────────────────────────────
    initial_state = {
        "resume_text": resume_text,
        "target_role": target_role,
        "job_description": job_description if job_description else "Not provided",
    }

    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        state=initial_state,
    )
    logger.info(f"Session created: {session.id} | Initial state keys: {list(initial_state.keys())}")

    # Build a concise trigger message for the coordinator.
    # The full resume text is in session state — the user message just triggers execution.
    trigger_message = (
        f"Analyze the resume for the target role: {target_role}. "
        f"The resume text and all context are available in session state."
    )

    content = types.Content(
        role="user",
        parts=[types.Part.from_text(text=trigger_message)],
    )

    # Run the pipeline and collect events
    result: dict[str, Any] = {}
    try:
        event_count = 0
        async for event in runner.run_async(
            session_id=session.id,
            user_id=USER_ID,
            new_message=content,
        ):
            event_count += 1
            # Log agent activity for debugging
            if hasattr(event, "author") and event.author:
                logger.debug(f"  Event [{event_count}] from '{event.author}': is_final={event.is_final_response()}")
            if event.is_final_response():
                logger.info(f"Pipeline completed after {event_count} events")

        # ── Extract results from session state ─────────────────────────────
        current_session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            session_id=session.id,
        )

        if current_session and current_session.state:
            state = current_session.state
            logger.info(f"Session state keys after pipeline: {list(state.keys())}")

            profile_raw = state.get("profile_data", "{}")
            career_raw = state.get("career_analysis", "{}")
            coaching_raw = state.get("coaching_plan", "{}")

            profile_parsed = _safe_parse_json(profile_raw)
            career_parsed = _safe_parse_json(career_raw)
            coaching_parsed = _safe_parse_json(coaching_raw)

            # Check if we got meaningful data from at least the profile agent
            if not profile_parsed or profile_parsed == {}:
                logger.warning("Profile agent returned empty data — pipeline may have partially failed")

            result = {
                "profile_data": profile_parsed,
                "career_analysis": career_parsed,
                "coaching_plan": coaching_parsed,
                "status": "success",
            }
        else:
            logger.error("Session state is empty after pipeline execution")
            result = {
                "status": "error",
                "message": (
                    "Analysis pipeline completed but no results were stored. "
                    "This may indicate an agent configuration issue."
                ),
            }

    except Exception as e:
        logger.error(f"Pipeline execution error: {str(e)}", exc_info=True)
        result = {
            "status": "error",
            "message": f"Analysis pipeline failed: {str(e)}",
        }

    return result


def _safe_parse_json(raw: str | dict | None) -> dict:
    """Safely parse a JSON string or return the dict if already parsed."""
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        # Strip markdown code fences if present (Gemini sometimes wraps JSON)
        cleaned = raw.strip()
        for prefix in ("```json", "```"):
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):]
                break
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}. Returning raw string.")
            return {"raw_response": raw}
    return {"raw_response": str(raw)}
