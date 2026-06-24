from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database import applications_collection, candidates_collection, jobs_collection
from app.models.application import ApplicationCreate, ApplicationStatusUpdate
from app.utils.dependencies import get_current_user, require_recruiter, require_hiring_manager
from app.utils.matching_engine import calculate_match_score

router = APIRouter(prefix="/api", tags=["Applications"])


def serialize_application(app: dict) -> dict:
    app["id"] = str(app["_id"])
    app.pop("_id", None)
    return app


@router.post("/apply", status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    application_data: ApplicationCreate,
    current_user: dict = Depends(get_current_user),
):
    """Submit a job application. Triggers the AI matching engine."""
    if current_user.get("role") != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can apply for jobs.")

    user_id = str(current_user["_id"])

    # Verify job exists
    try:
        job = await jobs_collection.find_one({"_id": ObjectId(application_data.jobId)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID.")
    if not job or job.get("status") != "active":
        raise HTTPException(status_code=404, detail="Job not found or no longer active.")

    # Get candidate profile
    candidate = await candidates_collection.find_one({"userId": user_id})
    if not candidate:
        raise HTTPException(
            status_code=400,
            detail="Please upload your resume first before applying.",
        )

    job_id_str = str(job["_id"])

    # Check duplicate application
    existing_app = await applications_collection.find_one(
        {"candidateId": str(candidate["_id"]), "jobId": job_id_str}
    )
    if existing_app:
        raise HTTPException(status_code=409, detail="You have already applied for this job.")

    # ── Run AI Matching Engine ─────────────────────────────────────────────────
    match_result = calculate_match_score(candidate, job)

    app_doc = {
        "candidateId": str(candidate["_id"]),
        "candidateUserId": user_id,
        "candidateName": candidate.get("name", current_user.get("name", "")),
        "candidateEmail": candidate.get("email", current_user.get("email", "")),
        "candidateSkills": candidate.get("skills", []),
        "candidateExperience": candidate.get("experience_years", 0),
        "jobId": job_id_str,
        "jobTitle": job.get("title", ""),
        "jobDepartment": job.get("department", ""),
        "jobLocation": job.get("location", ""),
        "matchScore": match_result["match_score"],
        "matchRank": match_result["rank"],
        "skillScore": match_result["skill_score"],
        "experienceScore": match_result["experience_score"],
        "educationScore": match_result["education_score"],
        "certificationScore": match_result["certification_score"],
        "matchedSkills": match_result["matched_skills"],
        "status": "applied",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await applications_collection.insert_one(app_doc)
    app_doc["id"] = str(result.inserted_id)
    app_doc.pop("_id", None)

    return {
        "message": "Application submitted successfully",
        "application": app_doc,
    }


@router.get("/applications")
async def get_applications(
    current_user: dict = Depends(get_current_user),
    job_id: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    max_score: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("matchScore"),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """
    Get applications:
    - Candidate: their own applications only
    - Recruiter/HM: all applications with optional filters
    """
    query: dict = {}
    role = current_user.get("role", "candidate")

    if role == "candidate":
        # Candidates see only their own applications
        candidate = await candidates_collection.find_one({"userId": str(current_user["_id"])})
        if not candidate:
            return []
        query["candidateId"] = str(candidate["_id"])
    else:
        # Recruiters/HMs can optionally filter by job
        if job_id:
            query["jobId"] = job_id

    # Score filters
    if min_score is not None or max_score is not None:
        score_filter = {}
        if min_score is not None:
            score_filter["$gte"] = min_score
        if max_score is not None:
            score_filter["$lte"] = max_score
        query["matchScore"] = score_filter

    if status_filter:
        query["status"] = status_filter

    # Sort
    sort_field = "matchScore" if sort_by == "matchScore" else "created_at"
    applications = (
        await applications_collection.find(query).sort(sort_field, -1).to_list(500)
    )

    # Enrich with denormalized candidate/job info (fill gaps from legacy seeded docs)
    enriched = []
    for app in applications:
        app["id"] = str(app["_id"])
        app.pop("_id", None)

        # ── Enrich candidate info if missing ──────────────────────────────────
        if not app.get("candidateName"):
            try:
                cand = await candidates_collection.find_one({"_id": ObjectId(app["candidateId"])})
                if cand:
                    app["candidateName"]     = cand.get("name", "")
                    app["candidateEmail"]    = cand.get("email", "")
                    app["candidateSkills"]   = cand.get("skills", [])
                    app["candidateExperience"] = cand.get("experience_years", 0)
                    app["resumeUrl"]         = cand.get("resumeUrl", "")
            except Exception:
                pass

        # ── Enrich job info if missing ─────────────────────────────────────────
        if not app.get("jobTitle"):
            try:
                job = await jobs_collection.find_one({"_id": ObjectId(app["jobId"])})
                if job:
                    app["jobTitle"]      = job.get("title", "")
                    app["jobDepartment"] = job.get("department", "")
                    app["jobLocation"]   = job.get("location", "")
            except Exception:
                pass

        enriched.append(app)

    return enriched


@router.get("/applications/{application_id}")
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a single application by ID."""
    try:
        app = await applications_collection.find_one({"_id": ObjectId(application_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID.")
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    return serialize_application(app)


@router.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    current_user: dict = Depends(require_hiring_manager),
):
    """Update an application's pipeline status (Recruiter/Hiring Manager only)."""
    try:
        app = await applications_collection.find_one({"_id": ObjectId(application_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID.")
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    await applications_collection.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": status_update.status, "updated_at": datetime.utcnow()}},
    )
    updated = await applications_collection.find_one({"_id": ObjectId(application_id)})
    return serialize_application(updated)
