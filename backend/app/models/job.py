from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(..., min_length=2)
    department: str = ""
    experienceRequired: float = 0.0
    skillsRequired: List[str] = []
    location: str = ""
    salaryRange: str = ""
    description: str = ""
    educationRequired: str = ""
    certificationsRequired: List[str] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    experienceRequired: Optional[float] = None
    skillsRequired: Optional[List[str]] = None
    location: Optional[str] = None
    salaryRange: Optional[str] = None
    description: Optional[str] = None
    educationRequired: Optional[str] = None
    certificationsRequired: Optional[List[str]] = None
    status: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    recruiterId: str
    title: str
    department: str
    experienceRequired: float
    skillsRequired: List[str]
    location: str
    salaryRange: str
    description: str
    educationRequired: str
    certificationsRequired: List[str]
    status: str
    created_at: datetime
