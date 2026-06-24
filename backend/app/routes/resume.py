import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, status, Depends
from fastapi.responses import FileResponse
from bson import ObjectId
from app.database import candidates_collection
from app.utils.dependencies import get_current_user, require_candidate
from app.utils.parser import parse_resume
from app.config import settings

router = APIRouter(prefix="/api/resume", tags=["Resume"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload and parse a resume file (PDF/DOCX). Stores file locally."""
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are allowed.",
        )

    # Validate file size
    file_bytes = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the {settings.max_file_size_mb}MB limit.",
        )

    # Save file locally
    os.makedirs(settings.upload_dir, exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    resume_url = f"/uploads/{unique_filename}"

    # Parse the resume
    parsed = parse_resume(file_bytes, file.filename)

    user_id = str(current_user["_id"])

    # Check if candidate profile already exists
    existing = await candidates_collection.find_one({"userId": user_id})

    candidate_doc = {
        "userId": user_id,
        "name": parsed.get("name") or current_user.get("name", ""),
        "email": parsed.get("email") or current_user.get("email", ""),
        "phone": parsed.get("phone", ""),
        "skills": parsed.get("skills", []),
        "experience_years": parsed.get("experience_years", 0.0),
        "education": parsed.get("education", []),
        "experience_details": parsed.get("experience_details", []),
        "certifications": parsed.get("certifications", []),
        "projects": parsed.get("projects", []),
        "education_level": parsed.get("education_level", 0),
        "resumeUrl": resume_url,
        "updated_at": datetime.utcnow(),
    }

    if existing:
        # Delete old resume file if exists
        old_url = existing.get("resumeUrl", "")
        if old_url and old_url.startswith("/uploads/"):
            old_path = old_url.lstrip("/")
            if os.path.exists(old_path):
                os.remove(old_path)

        await candidates_collection.update_one(
            {"userId": user_id}, {"$set": candidate_doc}
        )
        candidate_id = str(existing["_id"])
    else:
        candidate_doc["created_at"] = datetime.utcnow()
        result = await candidates_collection.insert_one(candidate_doc)
        candidate_id = str(result.inserted_id)

    return {
        "message": "Resume uploaded and parsed successfully",
        "candidate_profile": {
            "id": candidate_id,
            "userId": user_id,
            "name": candidate_doc["name"],
            "email": candidate_doc["email"],
            "phone": candidate_doc["phone"],
            "skills": candidate_doc["skills"],
            "experience_years": candidate_doc["experience_years"],
            "resumeUrl": resume_url,
        },
    }


@router.get("/me")
async def get_my_resume(current_user: dict = Depends(get_current_user)):
    """Get the current candidate's parsed profile."""
    user_id = str(current_user["_id"])
    candidate = await candidates_collection.find_one({"userId": user_id})
    if not candidate:
        raise HTTPException(status_code=404, detail="No resume profile found.")

    candidate["id"] = str(candidate["_id"])
    candidate.pop("_id", None)
    return candidate


@router.get("/{candidate_id}")
async def get_resume(candidate_id: str, current_user: dict = Depends(get_current_user)):
    """Get a candidate profile by ID (recruiter/admin view)."""
    try:
        candidate = await candidates_collection.find_one({"_id": ObjectId(candidate_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid candidate ID.")
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    candidate["id"] = str(candidate["_id"])
    candidate.pop("_id", None)
    return candidate


@router.delete("/{candidate_id}", status_code=status.HTTP_200_OK)
async def delete_resume(
    candidate_id: str, current_user: dict = Depends(get_current_user)
):
    """Delete a candidate's resume profile and file."""
    user_id = str(current_user["_id"])
    try:
        candidate = await candidates_collection.find_one({"_id": ObjectId(candidate_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid candidate ID.")

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    # Only the owner or admin can delete
    if candidate["userId"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")

    # Delete file
    resume_url = candidate.get("resumeUrl", "")
    if resume_url and resume_url.startswith("/uploads/"):
        file_path = resume_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    await candidates_collection.delete_one({"_id": ObjectId(candidate_id)})
    return {"message": "Resume profile removed successfully"}
