from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database import jobs_collection
from app.models.job import JobCreate, JobUpdate, JobResponse
from app.utils.dependencies import get_current_user, require_recruiter

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


def serialize_job(job: dict) -> dict:
    job["id"] = str(job["_id"])
    job.pop("_id", None)
    job["recruiterId"] = str(job.get("recruiterId", ""))
    return job


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(require_recruiter),
):
    """Create a new job posting (Recruiter only)."""
    job_doc = {
        **job_data.model_dump(),
        "recruiterId": str(current_user["_id"]),
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await jobs_collection.insert_one(job_doc)
    job_doc["id"] = str(result.inserted_id)
    job_doc.pop("_id", None)
    return {"message": "Job created successfully", "job": job_doc}


@router.get("/")
async def list_jobs(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """List all active jobs with optional search/filter."""
    query: dict = {}

    # Non-recruiters only see active jobs unless explicitly filtered
    if status_filter:
        query["status"] = status_filter
    else:
        query["status"] = "active"

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    if department:
        query["department"] = {"$regex": department, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}

    jobs = await jobs_collection.find(query).sort("created_at", -1).to_list(100)
    return [serialize_job(j) for j in jobs]


@router.get("/recruiter/my-jobs")
async def get_my_jobs(current_user: dict = Depends(require_recruiter)):
    """Get all jobs posted by the current recruiter."""
    recruiter_id = str(current_user["_id"])
    jobs = await jobs_collection.find({"recruiterId": recruiter_id}).sort("created_at", -1).to_list(100)
    return [serialize_job(j) for j in jobs]


@router.get("/{job_id}")
async def get_job(job_id: str):
    """Get a single job by ID."""
    try:
        job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID.")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return serialize_job(job)


@router.put("/{job_id}")
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(require_recruiter),
):
    """Update a job (Recruiter only, must own the job)."""
    try:
        job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID.")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job["recruiterId"] != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this job.")

    update_data = {k: v for k, v in job_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    await jobs_collection.update_one({"_id": ObjectId(job_id)}, {"$set": update_data})
    updated = await jobs_collection.find_one({"_id": ObjectId(job_id)})
    return serialize_job(updated)


@router.delete("/{job_id}")
async def archive_job(
    job_id: str,
    current_user: dict = Depends(require_recruiter),
):
    """Archive a job (sets status to 'archived')."""
    try:
        job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID.")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job["recruiterId"] != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")

    await jobs_collection.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "archived", "updated_at": datetime.utcnow()}},
    )
    return {"message": "Job successfully archived"}
