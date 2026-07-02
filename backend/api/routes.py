"""
API Routes — FastAPI route handlers for PlacementPilot AI.

Implements all REST API endpoints:
- GET  /api/health      — Health check
- GET  /api/roles       — List available roles
- GET  /api/resources   — Learning resources
- POST /api/analyze     — Full analysis (PDF upload)
- POST /api/analyze-text — Analysis from pasted text
- POST /api/ats-analysis — ATS optimization with JD
"""

import logging
import os
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from backend.api.models import (
    AnalysisResponse,
    AnalyzeTextRequest,
    ATSAnalysisRequest,
    ErrorResponse,
    HealthResponse,
    ResourceItem,
    ResourcesResponse,
    RoleMetadata,
    RolesResponse,
)
from backend.mcp_server.career_data import CAREER_ROLES
from backend.utils.pdf_parser import PDFParseError, parse_resume_pdf
from backend.utils.security import remove_pii, sanitize_input, validate_role_id
from backend.agents.coordinator import run_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["PlacementPilot AI"])


# ──────────────────────────────────────────────
# GET /api/health
# ──────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Check API health status and configuration."""
    api_key = os.getenv("GOOGLE_API_KEY", "")
    has_key = bool(api_key and api_key != "your_google_api_key_here")

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        api_key_configured=has_key,
        mcp_server_status="available",
        agents={
            "profile_agent": "ready",
            "career_agent": "ready",
            "coach_agent": "ready",
            "coordinator": "ready",
        },
    )


# ──────────────────────────────────────────────
# GET /api/roles
# ──────────────────────────────────────────────

@router.get("/roles", response_model=RolesResponse)
async def get_roles() -> RolesResponse:
    """Get all available career roles."""
    roles = []
    for role_id, role_data in CAREER_ROLES.items():
        roles.append(RoleMetadata(
            id=role_id,
            title=role_data["metadata"]["title"],
            description=role_data["metadata"]["description"],
            industry=role_data["metadata"]["industry"],
            difficulty=role_data["difficulty"],
            average_preparation_weeks=role_data["average_preparation_weeks"],
        ))

    return RolesResponse(roles=roles, total_count=len(roles))


# ──────────────────────────────────────────────
# GET /api/resources
# ──────────────────────────────────────────────

@router.get("/resources", response_model=ResourcesResponse)
async def get_resources() -> ResourcesResponse:
    """Get aggregated learning resources from all roles."""
    resources_map: dict[str, ResourceItem] = {}
    categories: set[str] = set()

    for role_data in CAREER_ROLES.values():
        role_title = role_data["metadata"]["title"]
        for resource in role_data.get("learning_resources", []):
            key = resource["name"]
            if key not in resources_map:
                resources_map[key] = ResourceItem(
                    name=resource["name"],
                    url=resource["url"],
                    type=resource["type"],
                    free=resource["free"],
                    category=resource["type"],
                )
                categories.add(resource["type"])

    return ResourcesResponse(
        resources=list(resources_map.values()),
        categories=sorted(categories),
    )


# ──────────────────────────────────────────────
# POST /api/analyze
# ──────────────────────────────────────────────

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(..., description="PDF resume file"),
    target_role: str = Form(..., description="Target role ID"),
    job_description: str = Form(default="", description="Optional job description"),
) -> AnalysisResponse:
    """
    Analyze an uploaded PDF resume against a target role.

    This is the primary analysis endpoint that:
    1. Validates and parses the uploaded PDF
    2. Removes PII from the extracted text
    3. Runs the full multi-agent analysis pipeline
    """
    try:
        # Validate role
        role_id = validate_role_id(target_role)
        if role_id not in CAREER_ROLES:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown role: '{role_id}'. Use GET /api/roles to see available roles.",
            )

        # Read and parse PDF
        file_content = await file.read()
        resume_text = parse_resume_pdf(
            file_content,
            content_type=file.content_type,
            filename=file.filename,
        )

        # Remove PII before AI processing
        safe_text = remove_pii(resume_text)
        safe_text = sanitize_input(safe_text)

        # Sanitize optional job description
        safe_jd = ""
        if job_description:
            safe_jd = sanitize_input(job_description, max_length=20000)

        # Run the analysis pipeline
        result = await run_analysis(
            resume_text=safe_text,
            target_role=role_id,
            job_description=safe_jd,
        )

        # Surface pipeline errors as HTTP 500 so the frontend can display them
        if result.get("status") == "error":
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "Analysis pipeline failed."),
            )

        return AnalysisResponse(**result)

    except PDFParseError as e:
        logger.warning(f"PDF parse error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ──────────────────────────────────────────────
# POST /api/analyze-text
# ──────────────────────────────────────────────

@router.post("/analyze-text", response_model=AnalysisResponse)
async def analyze_resume_text(request: AnalyzeTextRequest) -> AnalysisResponse:
    """
    Analyze pasted resume text against a target role.

    Same as /api/analyze but accepts plain text instead of a PDF upload.
    """
    try:
        # Validate role
        role_id = validate_role_id(request.target_role)
        if role_id not in CAREER_ROLES:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown role: '{role_id}'. Use GET /api/roles to see available roles.",
            )

        # Sanitize and remove PII
        safe_text = sanitize_input(request.resume_text)
        safe_text = remove_pii(safe_text)

        safe_jd = ""
        if request.job_description:
            safe_jd = sanitize_input(request.job_description, max_length=20000)

        # Run the analysis pipeline
        result = await run_analysis(
            resume_text=safe_text,
            target_role=role_id,
            job_description=safe_jd,
        )

        if result.get("status") == "error":
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "Analysis pipeline failed."),
            )

        return AnalysisResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in analyze-text: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ──────────────────────────────────────────────
# POST /api/ats-analysis
# ──────────────────────────────────────────────

@router.post("/ats-analysis", response_model=AnalysisResponse)
async def ats_analysis(request: ATSAnalysisRequest) -> AnalysisResponse:
    """
    Perform ATS-focused analysis comparing resume against a specific job description.

    This endpoint emphasizes ATS keyword matching and provides detailed
    keyword-level feedback for resume optimization.
    """
    try:
        # Validate role
        role_id = validate_role_id(request.target_role)
        if role_id not in CAREER_ROLES:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown role: '{role_id}'.",
            )

        # Sanitize inputs
        safe_text = sanitize_input(request.resume_text)
        safe_text = remove_pii(safe_text)
        safe_jd = sanitize_input(request.job_description, max_length=20000)

        # Run the full pipeline (ATS analysis is part of the Career Agent)
        result = await run_analysis(
            resume_text=safe_text,
            target_role=role_id,
            job_description=safe_jd,
        )

        if result.get("status") == "error":
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "Analysis pipeline failed."),
            )

        return AnalysisResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in ats-analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
