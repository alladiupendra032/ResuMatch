from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict

# ─── Request Models ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(candidate|recruiter|hiring_manager|admin)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ─── Response Models ───────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── DB Model ─────────────────────────────────────────────────────────────────

class UserInDB(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    password_hash: str
    role: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
