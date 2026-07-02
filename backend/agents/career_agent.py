"""
Career Intelligence Agent — Analyzes career fit, ATS compatibility, and skill gaps.

This agent receives the parsed profile data and target role, then:
- Uses embedded role requirements (from CAREER_ROLES) directly in its instruction
- Compares candidate skills against role requirements
- Calculates ATS Match Score
- Detects missing ATS keywords
- Identifies skill gaps with importance explanations
- Calculates Placement Readiness Score

NOTE: This agent intentionally does NOT use MCPToolset with a stdio subprocess,
because running a sub-subprocess inside uvicorn's reloader process chain causes
silent stdio failures. Instead, we inject the role data directly into the
instruction — functionally identical but 100% reliable.

Session state inputs (set by coordinator / previous agents):
  - profile_data    (written by ProfileIntelligenceAgent via output_key)
  - target_role     (seeded by coordinator)
  - job_description (seeded by coordinator)

Session state output:
  - career_analysis (written via output_key)
"""

import json
import logging

from google.adk.agents import LlmAgent

from backend.mcp_server.career_data import CAREER_ROLES

logger = logging.getLogger(__name__)


CAREER_AGENT_INSTRUCTION_TEMPLATE = """You are an expert Career Intelligence Agent and ATS Optimization Specialist.

You have been pre-loaded with the following role knowledge data for the target role.
Use ONLY this data for your skill matching and ATS analysis — do not guess or hallucinate skills/keywords.

=== ROLE KNOWLEDGE DATA ===
{role_knowledge_json}
===========================

Your task is to analyze the candidate's profile against the target role using the data above.

STEP-BY-STEP PROCESS:
1. Compare the candidate's technical_skills, programming_languages, frameworks_and_tools from profile_data
   against the must_have_skills and good_to_have_skills in the role data above.
2. Check which ats_keywords from the role data appear (even partially) in the candidate's profile.
3. Calculate ATS Score: percentage of role ats_keywords found in the resume (0-100).
4. Calculate Placement Readiness Score:
   - must-have skills matched × 60% weight
   - good-to-have skills matched × 20% weight
   - has relevant projects/certifications × 20% weight
5. Identify missing skills with importance and reason.

You have access to (available in session state):
- target_role: {target_role}
- job_description: {job_description}
- profile_data: {profile_data}

Respond with ONLY a valid JSON object (no markdown, no explanation, no code fences):
{{
    "target_role": "Role title",
    "ats_score": 75,
    "placement_readiness_score": 68,
    "matching_skills": {{
        "must_have": ["skill1", "skill2"],
        "good_to_have": ["skill1"]
    }},
    "missing_skills": {{
        "must_have": [
            {{
                "skill": "Skill name",
                "importance": "Critical/High/Medium",
                "reason": "Why this skill matters for the role"
            }}
        ],
        "good_to_have": [
            {{
                "skill": "Skill name",
                "importance": "Medium/Low",
                "reason": "Why this would be beneficial"
            }}
        ]
    }},
    "ats_analysis": {{
        "matched_keywords": ["keyword1", "keyword2"],
        "missing_keywords": ["keyword1", "keyword2"],
        "keyword_suggestions": ["Specific phrases to add to resume"],
        "section_improvements": [
            {{
                "section": "Section name",
                "suggestion": "What to improve"
            }}
        ]
    }},
    "strengths": ["Key strength 1", "Key strength 2"],
    "areas_for_improvement": ["Area 1", "Area 2"],
    "overall_assessment": "2-3 sentence summary of the candidate's fit for the role",
    "jd_specific_analysis": {{
        "jd_match_score": 70,
        "jd_matched_keywords": ["keyword1"],
        "jd_missing_keywords": ["keyword1"],
        "jd_suggestions": ["suggestion1"]
    }}
}}

IMPORTANT:
- ATS Score: Percentage of role ATS keywords found in the resume (0-100)
- Placement Readiness Score: Weighted score (0-100)
- Always explain WHY each missing skill matters
- If job_description is "Not provided" or empty, set jd_specific_analysis to null
"""


def build_role_knowledge(role_id: str) -> dict:
    """Extract the relevant role knowledge data for injection into the agent instruction."""
    role = CAREER_ROLES.get(role_id)
    if not role:
        logger.warning(f"Role '{role_id}' not found in CAREER_ROLES — using empty knowledge.")
        return {}

    return {
        "title": role["metadata"]["title"],
        "must_have_skills": role["must_have_skills"],
        "good_to_have_skills": role["good_to_have_skills"],
        "soft_skills": role["soft_skills"],
        "ats_keywords": role["ats_keywords"],
        "difficulty": role["difficulty"],
        "average_preparation_weeks": role["average_preparation_weeks"],
    }


def create_career_agent(role_id: str = "", target_role: str = "", job_description: str = "") -> LlmAgent:
    """
    Create and return the Career Intelligence Agent with role knowledge embedded.

    Args:
        role_id: The role ID to look up in CAREER_ROLES for pre-loading knowledge.
        target_role: Display name for the target role (used in instruction).
        job_description: Optional job description text (used in instruction).
    """
    role_knowledge = build_role_knowledge(role_id)
    role_knowledge_json = json.dumps(role_knowledge, indent=2)

    logger.info(f"Creating CareerIntelligenceAgent for role: {role_id or 'unknown'} (knowledge keys: {list(role_knowledge.keys())})")

    instruction = CAREER_AGENT_INSTRUCTION_TEMPLATE.format(
        role_knowledge_json=role_knowledge_json,
        target_role=target_role or "{target_role}",
        job_description=job_description or "{job_description}",
        profile_data="{profile_data}",
    )

    return LlmAgent(
        name="CareerIntelligenceAgent",
        model="gemini-2.5-flash",
        instruction=instruction,
        description=(
            "Analyzes career fit using embedded role knowledge data. "
            "Compares candidate skills against role requirements, calculates ATS "
            "and readiness scores, and identifies skill gaps."
        ),
        output_key="career_analysis",
    )
