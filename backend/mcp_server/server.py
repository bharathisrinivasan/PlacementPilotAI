"""
PlacementPilot AI — MCP Server for Career Knowledge.

A FastMCP-based Model Context Protocol server that exposes structured career
knowledge data as tools. ADK agents query this server to get role requirements,
ATS keywords, learning resources, and skill comparisons.

Usage:
    python -m backend.mcp_server.server
"""

import json
import sys
import os

# Add parent directory to path for imports when run as subprocess
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from mcp.server.fastmcp import FastMCP

from backend.mcp_server.career_data import CAREER_ROLES, get_all_role_ids, get_role_data

# Initialize the MCP Server
mcp = FastMCP("PlacementPilot Career Knowledge Server")


@mcp.tool()
def get_all_roles() -> str:
    """
    Get a list of all available career roles with their metadata.
    Returns a JSON string containing role IDs, titles, descriptions,
    difficulty levels, and average preparation weeks.
    """
    roles_summary = []
    for role_id, role_data in CAREER_ROLES.items():
        roles_summary.append({
            "id": role_id,
            "title": role_data["metadata"]["title"],
            "description": role_data["metadata"]["description"],
            "industry": role_data["metadata"]["industry"],
            "difficulty": role_data["difficulty"],
            "average_preparation_weeks": role_data["average_preparation_weeks"],
        })
    return json.dumps(roles_summary, indent=2)


@mcp.tool()
def get_role_details(role_id: str) -> str:
    """
    Get complete details for a specific career role including all skills,
    certifications, ATS keywords, interview topics, project recommendations,
    and learning resources.

    Args:
        role_id: The unique identifier for the role (e.g., 'software_engineer').
    """
    role = get_role_data(role_id)
    if role is None:
        available = get_all_role_ids()
        return json.dumps({
            "error": f"Role '{role_id}' not found.",
            "available_roles": available,
        })
    return json.dumps(role, indent=2)


@mcp.tool()
def get_role_requirements(role_id: str) -> str:
    """
    Get the skills and requirements for a specific role.
    Returns must-have skills, good-to-have skills, and soft skills.

    Args:
        role_id: The unique identifier for the role (e.g., 'data_scientist').
    """
    role = get_role_data(role_id)
    if role is None:
        return json.dumps({"error": f"Role '{role_id}' not found."})

    return json.dumps({
        "role": role["metadata"]["title"],
        "must_have_skills": role["must_have_skills"],
        "good_to_have_skills": role["good_to_have_skills"],
        "soft_skills": role["soft_skills"],
        "difficulty": role["difficulty"],
        "average_preparation_weeks": role["average_preparation_weeks"],
    }, indent=2)


@mcp.tool()
def get_ats_keywords(role_id: str) -> str:
    """
    Get ATS (Applicant Tracking System) keywords for a specific role.
    These are keywords that should appear in a resume targeting this role.

    Args:
        role_id: The unique identifier for the role.
    """
    role = get_role_data(role_id)
    if role is None:
        return json.dumps({"error": f"Role '{role_id}' not found."})

    return json.dumps({
        "role": role["metadata"]["title"],
        "ats_keywords": role["ats_keywords"],
        "must_have_skills": role["must_have_skills"],
        "good_to_have_skills": role["good_to_have_skills"],
    }, indent=2)


@mcp.tool()
def get_learning_resources(role_id: str) -> str:
    """
    Get learning resources and project recommendations for a specific role.
    Includes courses, books, practice platforms, and suggested projects.

    Args:
        role_id: The unique identifier for the role.
    """
    role = get_role_data(role_id)
    if role is None:
        return json.dumps({"error": f"Role '{role_id}' not found."})

    return json.dumps({
        "role": role["metadata"]["title"],
        "learning_resources": role["learning_resources"],
        "project_recommendations": role["project_recommendations"],
        "certifications": role["certifications"],
    }, indent=2)


@mcp.tool()
def get_interview_topics(role_id: str) -> str:
    """
    Get interview preparation topics for a specific role.
    Includes key topics, certifications to highlight, and suggested
    preparation strategies.

    Args:
        role_id: The unique identifier for the role.
    """
    role = get_role_data(role_id)
    if role is None:
        return json.dumps({"error": f"Role '{role_id}' not found."})

    return json.dumps({
        "role": role["metadata"]["title"],
        "interview_topics": role["interview_topics"],
        "certifications": role["certifications"],
        "difficulty": role["difficulty"],
        "average_preparation_weeks": role["average_preparation_weeks"],
    }, indent=2)


@mcp.tool()
def compare_skills(role_id: str, candidate_skills: str) -> str:
    """
    Compare a candidate's skills against a specific role's requirements.
    Identifies matching skills, missing must-have skills, missing good-to-have
    skills, and calculates a basic match percentage.

    Args:
        role_id: The unique identifier for the role.
        candidate_skills: A comma-separated string of the candidate's skills.
    """
    role = get_role_data(role_id)
    if role is None:
        return json.dumps({"error": f"Role '{role_id}' not found."})

    # Parse candidate skills (comma-separated, case-insensitive)
    candidate_skill_list = [s.strip().lower() for s in candidate_skills.split(",") if s.strip()]

    must_have = role["must_have_skills"]
    good_to_have = role["good_to_have_skills"]

    # Case-insensitive matching
    must_have_lower = {s.lower(): s for s in must_have}
    good_to_have_lower = {s.lower(): s for s in good_to_have}

    matching_must_have = []
    missing_must_have = []
    matching_good_to_have = []
    missing_good_to_have = []

    for skill_lower, skill_original in must_have_lower.items():
        if any(cs in skill_lower or skill_lower in cs for cs in candidate_skill_list):
            matching_must_have.append(skill_original)
        else:
            missing_must_have.append(skill_original)

    for skill_lower, skill_original in good_to_have_lower.items():
        if any(cs in skill_lower or skill_lower in cs for cs in candidate_skill_list):
            matching_good_to_have.append(skill_original)
        else:
            missing_good_to_have.append(skill_original)

    total_skills = len(must_have) + len(good_to_have)
    matching_count = len(matching_must_have) + len(matching_good_to_have)
    match_percentage = round((matching_count / total_skills) * 100, 1) if total_skills > 0 else 0

    # Must-have skills weighted more heavily for readiness
    must_have_match_pct = round(
        (len(matching_must_have) / len(must_have)) * 100, 1
    ) if must_have else 0

    return json.dumps({
        "role": role["metadata"]["title"],
        "overall_match_percentage": match_percentage,
        "must_have_match_percentage": must_have_match_pct,
        "matching_must_have_skills": matching_must_have,
        "missing_must_have_skills": missing_must_have,
        "matching_good_to_have_skills": matching_good_to_have,
        "missing_good_to_have_skills": missing_good_to_have,
        "candidate_skills_analyzed": len(candidate_skill_list),
        "total_required_skills": total_skills,
    }, indent=2)


if __name__ == "__main__":
    mcp.run()
