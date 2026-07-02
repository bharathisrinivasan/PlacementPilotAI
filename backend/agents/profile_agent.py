"""
Profile Intelligence Agent — Parses resumes and extracts structured profile data.

This agent receives raw resume text and uses Gemini to extract:
- Technical and soft skills
- Education history
- Certifications
- Internships and work experience
- Projects
- Summary

All PII is stripped before processing.
"""

from google.adk.agents import LlmAgent

PROFILE_AGENT_INSTRUCTION = """You are an expert Resume Parser and Profile Intelligence Agent.

Your task is to analyze the provided resume text and extract structured information.

IMPORTANT RULES:
1. NEVER include any Personally Identifiable Information (PII) in your output:
   - NO names, emails, phone numbers, addresses, LinkedIn URLs, GitHub URLs
   - NO dates of birth, social security numbers, or any personal identifiers
2. Focus ONLY on professional qualifications, skills, education, and experience
3. Be thorough — extract every skill, technology, tool, and framework mentioned
4. Categorize skills accurately (technical vs soft)
5. For education, include degree, field, and institution type (but NOT institution name if it could identify someone)

You MUST respond with ONLY a valid JSON object (no markdown, no explanation, no code fences) in this exact format:
{
    "summary": "Brief 2-3 sentence professional summary based on the resume",
    "technical_skills": ["skill1", "skill2", ...],
    "soft_skills": ["skill1", "skill2", ...],
    "programming_languages": ["lang1", "lang2", ...],
    "frameworks_and_tools": ["framework1", "tool1", ...],
    "education": [
        {
            "degree": "Degree type",
            "field": "Field of study",
            "level": "Bachelor/Master/PhD/Diploma",
            "graduation_status": "Completed/Pursuing/Expected YYYY"
        }
    ],
    "certifications": ["cert1", "cert2", ...],
    "internships": [
        {
            "role": "Role title",
            "duration": "Duration",
            "description": "Brief description of work",
            "technologies_used": ["tech1", "tech2"]
        }
    ],
    "projects": [
        {
            "title": "Project name",
            "description": "Brief description",
            "technologies_used": ["tech1", "tech2"],
            "key_achievements": ["achievement1"]
        }
    ],
    "experience_years": "Estimated years (number or 'Fresher')",
    "strengths": ["strength1", "strength2", ...],
    "warnings": ["Any concerns about the resume, e.g., 'No projects listed', 'Missing certifications'"]
}

Analyze the following resume text and extract all relevant information:

{resume_text}
"""


def create_profile_agent() -> LlmAgent:
    """Create and return the Profile Intelligence Agent."""
    return LlmAgent(
        name="ProfileIntelligenceAgent",
        model="gemini-2.5-flash",
        instruction=PROFILE_AGENT_INSTRUCTION,
        description="Parses resume text and extracts structured profile data including skills, education, certifications, and projects. Strips all PII.",
        output_key="profile_data",
    )
