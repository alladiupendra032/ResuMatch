import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import create_indexes
from app.routes import auth, resume, jobs, applications, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    os.makedirs(settings.upload_dir, exist_ok=True)
    print("[OK] ResuMatch API started successfully!")
    print(f"[DB] MongoDB: {settings.mongodb_url}/{settings.database_name}")
    print(f"[UP] Uploads dir: {settings.upload_dir}/")
    yield

app = FastAPI(
    title="ResuMatch API",
    description="AI-Driven Applicant Tracking & Talent Acquisition System",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static Files (Resume Uploads) ────────────────────────────────────────────
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# ─── Routes ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    return {
        "app": "ResuMatch",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
