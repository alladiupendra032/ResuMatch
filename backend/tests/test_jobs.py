import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


async def get_token(client, email, password, name=None, role=None):
    """Helper to register+login and return token."""
    if name:
        await client.post("/api/auth/register", json={"name": name, "email": email, "password": password, "role": role})
    resp = await client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json().get("access_token", "")


@pytest.mark.asyncio
async def test_recruiter_cannot_apply():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token = await get_token(client, "rec_test_jobs@x.com", "pass123", "Rec Test", "recruiter")
        resp = await client.post("/api/apply", json={"jobId": "000000000000000000000001"},
                                 headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403


@pytest.mark.asyncio
async def test_candidate_cannot_create_job():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token = await get_token(client, "cand_test_jobs@x.com", "pass123", "Cand Test", "candidate")
        resp = await client.post("/api/jobs/", json={"title": "Hacked Job"},
                                 headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_and_list_jobs():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token = await get_token(client, "rec_jobs2@x.com", "pass123", "Rec Jobs", "recruiter")
        headers = {"Authorization": f"Bearer {token}"}
        # Create a job
        create_resp = await client.post("/api/jobs/", headers=headers, json={
            "title": "Test Python Dev",
            "department": "Engineering",
            "experienceRequired": 2,
            "skillsRequired": ["Python", "FastAPI"],
            "location": "Remote",
            "salaryRange": "$60k–$90k",
            "description": "We need a Python dev.",
            "educationRequired": "bachelor",
            "certificationsRequired": [],
        })
        assert create_resp.status_code == 201
        job_id = create_resp.json()["job"]["id"]

        # List jobs
        list_resp = await client.get("/api/jobs/")
        assert list_resp.status_code == 200
        titles = [j["title"] for j in list_resp.json()]
        assert "Test Python Dev" in titles

        # Get single job
        get_resp = await client.get(f"/api/jobs/{job_id}")
        assert get_resp.status_code == 200

        # Archive job
        del_resp = await client.delete(f"/api/jobs/{job_id}", headers=headers)
        assert del_resp.status_code == 200
