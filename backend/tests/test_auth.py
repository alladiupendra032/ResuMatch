import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_register_user():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/register", json={
            "name": "Test Candidate",
            "email": "test_candidate_unique@example.com",
            "password": "password123",
            "role": "candidate"
        })
        assert response.status_code in (201, 409)  # 409 if already exists


@pytest.mark.asyncio
async def test_login_valid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register first
        await client.post("/api/auth/register", json={
            "name": "Login Test",
            "email": "login_test_unique@example.com",
            "password": "password123",
            "role": "candidate"
        })
        # Login
        response = await client.post("/api/auth/login", json={
            "email": "login_test_unique@example.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "candidate"


@pytest.mark.asyncio
async def test_login_invalid_credentials():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/auth/me")
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_protected_route_with_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register + Login
        await client.post("/api/auth/register", json={
            "name": "Protected Test",
            "email": "protected_unique@example.com",
            "password": "password123",
            "role": "recruiter"
        })
        login_resp = await client.post("/api/auth/login", json={
            "email": "protected_unique@example.com",
            "password": "password123"
        })
        token = login_resp.json()["access_token"]
        me_resp = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_resp.status_code == 200
        assert me_resp.json()["role"] == "recruiter"
