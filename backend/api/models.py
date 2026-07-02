"""
Pydantic Models — Request/Response schemas for all API endpoints.

Provides type-safe validation for all API interactions.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Request Models
# ──────────────────────────────────────────────

class AnalyzeTextRequest(BaseModel):
    """Request body for text-based resume analysis."""
    resume_text: str = Field(
        ...,
        min_length=50,
        max_length=50000,
        description="The plain text content of the resume.",
    )
    target_role: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="The target role ID (e.g., 'software_engineer').",
    )
    job_description: Optional[str] = Field(
        default="",
        max_length=20000,
        description="Optional job description for ATS matching.",
    )


class ATSAnalysisRequest(BaseModel):
    """Request body for ATS optimization analysis."""
    resume_text: str = Field(
        ...,
        min_length=50,
        max_length=50000,
        description="The resume text to analyze.",
    )
    target_role: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="The target role ID.",
    )
    job_description: str = Field(
        ...,
        min_length=20,
        max_length=20000,
        description="The job description to match against.",
    )


# ──────────────────────────────────────────────
# Response Models
# ──────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Response for health check endpoint."""
    status: str = "healthy"
    version: str = "1.0.0"
    api_key_configured: bool = False
    mcp_server_status: str = "available"
    agents: dict[str, str] = Field(default_factory=dict)


class RoleMetadata(BaseModel):
    """Metadata for a single career role."""
    id: str
    title: str
    description: str
    industry: str
    difficulty: str
    average_preparation_weeks: int


class RolesResponse(BaseModel):
    """Response containing all available roles."""
    roles: list[RoleMetadata]
    total_count: int


class ResourceItem(BaseModel):
    """A single learning resource."""
    name: str
    url: str
    type: str
    free: bool
    category: Optional[str] = None


class ResourcesResponse(BaseModel):
    """Response containing learning resources."""
    resources: list[ResourceItem]
    categories: list[str]


class AnalysisResponse(BaseModel):
    """Response for the full analysis pipeline."""
    status: str
    message: Optional[str] = None
    profile_data: Optional[dict[str, Any]] = None
    career_analysis: Optional[dict[str, Any]] = None
    coaching_plan: Optional[dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    status: str = "error"
    error_code: str
    message: str
    details: Optional[str] = None
