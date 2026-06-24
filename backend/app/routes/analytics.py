from fastapi import APIRouter, Depends
from app.database import applications_collection, jobs_collection, candidates_collection
from app.utils.dependencies import require_recruiter

router = APIRouter(prefix="/api/recruiter", tags=["Analytics"])


@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(require_recruiter)):
    """
    Get recruiter dashboard analytics.
    Shows recruiter-specific data if they have jobs,
    otherwise falls back to global platform stats.
    """
    recruiter_id = str(current_user["_id"])

    # ── Get this recruiter's own jobs ──────────────────────────────────────────
    my_jobs = await jobs_collection.find({"recruiterId": recruiter_id}).sort("created_at", -1).to_list(1000)
    my_job_ids = [str(j["_id"]) for j in my_jobs]

    # ── Fallback: if this recruiter has no jobs, show ALL platform data ────────
    use_global = len(my_jobs) == 0
    if use_global:
        all_jobs = await jobs_collection.find({}).sort("created_at", -1).to_list(1000)
        all_job_ids = [str(j["_id"]) for j in all_jobs]
        display_jobs = all_jobs
    else:
        all_jobs = my_jobs
        all_job_ids = my_job_ids
        display_jobs = my_jobs

    active_jobs_count = sum(1 for j in all_jobs if j.get("status") == "active")

    # ── Get applications for these jobs ────────────────────────────────────────
    all_apps = await applications_collection.find(
        {"jobId": {"$in": all_job_ids}} if all_job_ids else {}
    ).to_list(10000)

    total_applicants = len(all_apps)
    interviews_scheduled = sum(1 for a in all_apps if a.get("status") == "interview")
    offers_released = sum(1 for a in all_apps if a.get("status") == "selected")

    # ── Match score distribution ───────────────────────────────────────────────
    excellent = sum(1 for a in all_apps if (a.get("matchScore") or 0) >= 85)
    good      = sum(1 for a in all_apps if 70 <= (a.get("matchScore") or 0) < 85)
    moderate  = sum(1 for a in all_apps if 50 <= (a.get("matchScore") or 0) < 70)
    low       = sum(1 for a in all_apps if (a.get("matchScore") or 0) < 50)

    # ── Application pipeline status distribution ───────────────────────────────
    status_counts: dict = {}
    for app in all_apps:
        s = app.get("status", "applied")
        status_counts[s] = status_counts.get(s, 0) + 1

    # ── Per-job stats (top 10 by applicant count) ──────────────────────────────
    job_stats = []
    for job in display_jobs[:10]:
        job_id = str(job["_id"])
        job_apps = [a for a in all_apps if a.get("jobId") == job_id]
        avg_score = (
            round(sum(a.get("matchScore", 0) for a in job_apps) / len(job_apps), 1)
            if job_apps else 0
        )
        job_stats.append({
            "jobId": job_id,
            "title": job.get("title", ""),
            "department": job.get("department", ""),
            "status": job.get("status", ""),
            "applicantCount": len(job_apps),
            "avgMatchScore": avg_score,
        })

    # Sort by applicant count descending
    job_stats.sort(key=lambda x: x["applicantCount"], reverse=True)

    return {
        "kpis": {
            "total_applicants": total_applicants,
            "active_jobs": active_jobs_count,
            "interviews_scheduled": interviews_scheduled,
            "offers_released": offers_released,
        },
        "match_distribution": {
            "excellent": excellent,
            "good": good,
            "moderate": moderate,
            "low": low,
        },
        "status_distribution": status_counts,
        "job_stats": job_stats,
        "scope": "global" if use_global else "own",
    }
