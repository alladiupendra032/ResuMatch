from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class EducationEntry(BaseModel):
    degree: str = ""
    field_of_study: str = ""
    institution: str = ""
    year: Optional[int] = None


class ExperienceEntry(BaseModel):
    job_title: str = ""
    company: str = ""
    duration: str = ""
    description: str = ""


class ProjectEntry(BaseModel):
    title: str = ""
    description: str = ""
    technologies: List[str] = []


class CandidateProfile(BaseModel):
    id: Optional[str] = None
    userId: str
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: List[str] = []
    experience_years: float = 0.0
    education: List[EducationEntry] = []
    experience_details: List[ExperienceEntry] = []
    certifications: List[str] = []
    projects: List[ProjectEntry] = []
    resumeUrl: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CandidateResponse(BaseModel):
    id: str
    userId: str
    name: str
    email: str
    phone: str
    skills: List[str]
    experience_years: float
    education: List[EducationEntry]
    experience_details: List[ExperienceEntry]
    certifications: List[str]
    projects: List[ProjectEntry]
    resumeUrl: Optional[str]
