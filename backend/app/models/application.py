from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ApplicationCreate(BaseModel):
    jobId: str


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(applied|under_review|shortlisted|interview|selected|rejected)$")


class ApplicationResponse(BaseModel):
    id: str
    candidateId: str
    jobId: str
    matchScore: Optional[float] = None
    matchRank: Optional[str] = None
    status: str
    created_at: datetime

    # Optional joined fields
    candidateName: Optional[str] = None
    candidateEmail: Optional[str] = None
    candidateSkills: Optional[list] = None
    candidateExperience: Optional[float] = None
    jobTitle: Optional[str] = None
    jobDepartment: Optional[str] = None
