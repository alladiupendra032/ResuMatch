"""
seed_data.py — Populate ResuMatch database with realistic sample data.
Run from the backend/ directory:
    py seed_data.py
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
import random

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import db
from app.utils.security import hash_password
from app.utils.matching_engine import calculate_match_score
from bson import ObjectId

# ─── Helper ───────────────────────────────────────────────────────────────────
def now_minus(days=0, hours=0):
    return datetime.utcnow() - timedelta(days=days, hours=hours)

def new_id():
    return ObjectId()

# ─── Recruiters ───────────────────────────────────────────────────────────────
RECRUITERS = [
    {"name": "Priya Sharma",    "email": "priya@techcorp.com",    "company": "TechCorp India"},
    {"name": "Arjun Mehta",     "email": "arjun@startupxyz.com",  "company": "StartupXYZ"},
    {"name": "Sarah Williams",  "email": "sarah@globalsoft.com",  "company": "GlobalSoft"},
]

# ─── Hiring Managers ──────────────────────────────────────────────────────────
HIRING_MANAGERS = [
    {"name": "Rajesh Verma",   "email": "rajesh.hm@techcorp.com"},
    {"name": "Deepa Nambiar",  "email": "deepa.hm@globalsoft.com"},
]

# ─── Candidates ───────────────────────────────────────────────────────────────
CANDIDATES = [
    {
        "name": "Rahul Kumar",
        "email": "rahul.kumar@gmail.com",
        "skills": ["Python", "FastAPI", "MongoDB", "Docker", "REST API", "Git", "Linux"],
        "experience_years": 3,
        "education": [{"degree": "B.Tech Computer Science", "institution": "IIT Delhi", "year": "2021"}],
        "certifications": ["AWS Certified Developer", "Python Professional"],
        "phone": "+91-9876543210",
    },
    {
        "name": "Anjali Singh",
        "email": "anjali.singh@gmail.com",
        "skills": ["React", "JavaScript", "TypeScript", "Node.js", "CSS", "HTML", "Redux"],
        "experience_years": 2,
        "education": [{"degree": "B.E. Information Technology", "institution": "VIT Vellore", "year": "2022"}],
        "certifications": ["Meta Front-End Developer"],
        "phone": "+91-9876543211",
    },
    {
        "name": "Vikram Patel",
        "email": "vikram.patel@gmail.com",
        "skills": ["Java", "Spring Boot", "Microservices", "Kafka", "PostgreSQL", "AWS", "Docker", "Kubernetes"],
        "experience_years": 5,
        "education": [{"degree": "M.Tech Software Engineering", "institution": "NIT Trichy", "year": "2019"}],
        "certifications": ["AWS Solutions Architect", "Oracle Java SE"],
        "phone": "+91-9876543212",
    },
    {
        "name": "Meera Nair",
        "email": "meera.nair@gmail.com",
        "skills": ["Data Science", "Python", "Machine Learning", "TensorFlow", "Pandas", "SQL", "Tableau"],
        "experience_years": 4,
        "education": [{"degree": "M.Sc Data Science", "institution": "IISc Bangalore", "year": "2020"}],
        "certifications": ["Google Data Analytics", "TensorFlow Developer"],
        "phone": "+91-9876543213",
    },
    {
        "name": "Siddharth Joshi",
        "email": "sid.joshi@gmail.com",
        "skills": ["DevOps", "Docker", "Kubernetes", "CI/CD", "Jenkins", "Terraform", "AWS", "Linux", "Ansible"],
        "experience_years": 6,
        "education": [{"degree": "B.Tech Electronics", "institution": "BITS Pilani", "year": "2018"}],
        "certifications": ["CKA Kubernetes", "AWS DevOps Engineer", "HashiCorp Terraform"],
        "phone": "+91-9876543214",
    },
    {
        "name": "Divya Menon",
        "email": "divya.menon@gmail.com",
        "skills": ["UI/UX Design", "Figma", "Adobe XD", "HTML", "CSS", "JavaScript", "User Research"],
        "experience_years": 3,
        "education": [{"degree": "B.Des Visual Communication", "institution": "NID Ahmedabad", "year": "2021"}],
        "certifications": ["Google UX Design"],
        "phone": "+91-9876543215",
    },
    {
        "name": "Aditya Rao",
        "email": "aditya.rao@gmail.com",
        "skills": ["Python", "Django", "PostgreSQL", "Redis", "Celery", "REST API", "Git"],
        "experience_years": 2,
        "education": [{"degree": "B.Tech CSE", "institution": "RVCE Bangalore", "year": "2022"}],
        "certifications": [],
        "phone": "+91-9876543216",
    },
    {
        "name": "Kavitha Reddy",
        "email": "kavitha.reddy@gmail.com",
        "skills": ["Machine Learning", "Python", "NLP", "Deep Learning", "PyTorch", "SQL", "R"],
        "experience_years": 5,
        "education": [{"degree": "PhD Artificial Intelligence", "institution": "IIT Madras", "year": "2019"}],
        "certifications": ["DeepLearning.AI", "IBM Data Science"],
        "phone": "+91-9876543217",
    },
    {
        "name": "Rohan Gupta",
        "email": "rohan.gupta@gmail.com",
        "skills": ["React Native", "JavaScript", "TypeScript", "Firebase", "Redux", "iOS", "Android"],
        "experience_years": 3,
        "education": [{"degree": "B.Tech CSE", "institution": "SRM University", "year": "2021"}],
        "certifications": ["Google Associate Android Developer"],
        "phone": "+91-9876543218",
    },
    {
        "name": "Pooja Iyer",
        "email": "pooja.iyer@gmail.com",
        "skills": ["Cybersecurity", "Network Security", "Penetration Testing", "SIEM", "Python", "Linux"],
        "experience_years": 4,
        "education": [{"degree": "M.Tech Information Security", "institution": "IIIT Hyderabad", "year": "2020"}],
        "certifications": ["CEH", "CompTIA Security+"],
        "phone": "+91-9876543219",
    },
    {
        "name": "Aryan Shah",
        "email": "aryan.shah@gmail.com",
        "skills": ["Go", "Python", "Microservices", "gRPC", "Kubernetes", "AWS", "PostgreSQL"],
        "experience_years": 4,
        "education": [{"degree": "B.Tech CSE", "institution": "DTU Delhi", "year": "2020"}],
        "certifications": ["GCP Professional Cloud Developer"],
        "phone": "+91-9876543220",
    },
    {
        "name": "Sneha Kulkarni",
        "email": "sneha.kulkarni@gmail.com",
        "skills": ["Product Management", "Agile", "Scrum", "JIRA", "SQL", "Data Analysis", "Roadmapping"],
        "experience_years": 5,
        "education": [{"degree": "MBA", "institution": "IIM Kozhikode", "year": "2019"}],
        "certifications": ["Certified Scrum Product Owner", "Google PM"],
        "phone": "+91-9876543221",
    },
    {
        "name": "Nikhil Bansod",
        "email": "nikhil.bansod@gmail.com",
        "skills": ["Java", "Python", "Spring Boot", "REST API", "MySQL", "Git", "JUnit"],
        "experience_years": 1,
        "education": [{"degree": "B.Tech CSE", "institution": "Pune University", "year": "2023"}],
        "certifications": [],
        "phone": "+91-9876543222",
    },
    {
        "name": "Lakshmi Priya",
        "email": "lakshmi.priya@gmail.com",
        "skills": ["QA Testing", "Selenium", "Python", "JIRA", "API Testing", "Postman", "SQL"],
        "experience_years": 3,
        "education": [{"degree": "B.Tech CSE", "institution": "Anna University", "year": "2021"}],
        "certifications": ["ISTQB Foundation"],
        "phone": "+91-9876543223",
    },
    {
        "name": "Karan Malhotra",
        "email": "karan.malhotra@gmail.com",
        "skills": ["Flutter", "Dart", "Firebase", "REST API", "iOS", "Android", "Git"],
        "experience_years": 2,
        "education": [{"degree": "B.Tech IT", "institution": "Thapar University", "year": "2022"}],
        "certifications": [],
        "phone": "+91-9876543224",
    },
]

# ─── Jobs ─────────────────────────────────────────────────────────────────────
JOBS = [
    {
        "title": "Senior Python Backend Developer",
        "department": "Engineering",
        "location": "Bangalore (Hybrid)",
        "salaryRange": "₹18L – ₹28L / year",
        "experienceRequired": 3,
        "skillsRequired": ["Python", "FastAPI", "MongoDB", "Docker", "REST API", "Git"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "We are looking for a Senior Python Developer to design and build scalable backend services. You will work closely with the product team and lead a team of 2-3 junior developers.",
        "status": "active",
    },
    {
        "title": "React Frontend Engineer",
        "department": "Engineering",
        "location": "Remote",
        "salaryRange": "₹12L – ₹20L / year",
        "experienceRequired": 2,
        "skillsRequired": ["React", "JavaScript", "TypeScript", "CSS", "HTML", "Redux"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "Join our growing front-end team to build stunning and performant user interfaces for our SaaS product used by 500K+ users globally.",
        "status": "active",
    },
    {
        "title": "Data Scientist — ML Platform",
        "department": "Data & AI",
        "location": "Hyderabad (Hybrid)",
        "salaryRange": "₹20L – ₹35L / year",
        "experienceRequired": 4,
        "skillsRequired": ["Machine Learning", "Python", "TensorFlow", "SQL", "Pandas", "Deep Learning"],
        "educationRequired": "master",
        "certificationsRequired": ["TensorFlow Developer"],
        "description": "Lead the development of our ML platform. Build and deploy production-grade ML models for recommendation, fraud detection, and NLP systems.",
        "status": "active",
    },
    {
        "title": "DevOps / SRE Engineer",
        "department": "Infrastructure",
        "location": "Pune (On-site)",
        "salaryRange": "₹16L – ₹26L / year",
        "experienceRequired": 4,
        "skillsRequired": ["Docker", "Kubernetes", "CI/CD", "AWS", "Terraform", "Linux"],
        "educationRequired": "bachelor",
        "certificationsRequired": ["CKA Kubernetes"],
        "description": "Own and evolve our CI/CD pipelines, Kubernetes clusters, and cloud infrastructure. Drive uptime, reliability, and deployment velocity.",
        "status": "active",
    },
    {
        "title": "Java Microservices Engineer",
        "department": "Engineering",
        "location": "Mumbai (Hybrid)",
        "salaryRange": "₹15L – ₹25L / year",
        "experienceRequired": 3,
        "skillsRequired": ["Java", "Spring Boot", "Microservices", "Kafka", "PostgreSQL", "Docker"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "Design, build, and scale microservices powering our fintech platform. Work on high-throughput transaction processing and event-driven architecture.",
        "status": "active",
    },
    {
        "title": "UI/UX Designer",
        "department": "Design",
        "location": "Remote",
        "salaryRange": "₹10L – ₹18L / year",
        "experienceRequired": 2,
        "skillsRequired": ["Figma", "UI/UX Design", "Adobe XD", "User Research", "HTML", "CSS"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "Create intuitive, beautiful interfaces for our mobile and web products. You will own design from research to final handoff.",
        "status": "active",
    },
    {
        "title": "Machine Learning Engineer — NLP",
        "department": "Data & AI",
        "location": "Bangalore (On-site)",
        "salaryRange": "₹25L – ₹45L / year",
        "experienceRequired": 4,
        "skillsRequired": ["NLP", "Python", "PyTorch", "Deep Learning", "Machine Learning", "Transformers"],
        "educationRequired": "phd",
        "certificationsRequired": [],
        "description": "Build state-of-the-art NLP models for document understanding, conversational AI, and knowledge extraction at scale.",
        "status": "active",
    },
    {
        "title": "Mobile Developer (React Native)",
        "department": "Engineering",
        "location": "Remote",
        "salaryRange": "₹12L – ₹20L / year",
        "experienceRequired": 2,
        "skillsRequired": ["React Native", "JavaScript", "TypeScript", "Firebase", "Redux", "iOS", "Android"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "Build cross-platform mobile apps for iOS and Android using React Native. You will own features end-to-end from design review to App Store release.",
        "status": "active",
    },
    {
        "title": "Cybersecurity Analyst",
        "department": "Security",
        "location": "Delhi (Hybrid)",
        "salaryRange": "₹14L – ₹22L / year",
        "experienceRequired": 3,
        "skillsRequired": ["Cybersecurity", "Penetration Testing", "SIEM", "Python", "Linux", "Network Security"],
        "educationRequired": "bachelor",
        "certificationsRequired": ["CEH"],
        "description": "Protect our systems and data from threats. Conduct pen tests, manage SIEM alerts, and lead security awareness programs.",
        "status": "active",
    },
    {
        "title": "Product Manager",
        "department": "Product",
        "location": "Bangalore (On-site)",
        "salaryRange": "₹20L – ₹35L / year",
        "experienceRequired": 4,
        "skillsRequired": ["Product Management", "Agile", "Scrum", "SQL", "Data Analysis", "JIRA"],
        "educationRequired": "master",
        "certificationsRequired": ["Certified Scrum Product Owner"],
        "description": "Define product vision and roadmap. Work with engineering, design, and business teams to ship impactful features that delight users.",
        "status": "active",
    },
    {
        "title": "Backend Engineer — Go / Python",
        "department": "Engineering",
        "location": "Remote",
        "salaryRange": "₹18L – ₹30L / year",
        "experienceRequired": 3,
        "skillsRequired": ["Go", "Python", "gRPC", "Kubernetes", "PostgreSQL", "Microservices"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "Build high-performance backend systems in Go and Python. Design APIs, optimize database queries, and ensure system reliability at scale.",
        "status": "active",
    },
    {
        "title": "QA Automation Engineer",
        "department": "Quality",
        "location": "Chennai (Hybrid)",
        "salaryRange": "₹8L – ₹14L / year",
        "experienceRequired": 2,
        "skillsRequired": ["QA Testing", "Selenium", "Python", "API Testing", "Postman", "SQL", "JIRA"],
        "educationRequired": "bachelor",
        "certificationsRequired": ["ISTQB Foundation"],
        "description": "Own test automation for our web and API layers. Build robust test frameworks, catch regressions early, and improve release confidence.",
        "status": "active",
    },
    {
        "title": "Flutter Mobile Developer",
        "department": "Engineering",
        "location": "Remote",
        "salaryRange": "₹10L – ₹18L / year",
        "experienceRequired": 1,
        "skillsRequired": ["Flutter", "Dart", "Firebase", "REST API", "iOS", "Android"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "Build beautiful Flutter applications for Android and iOS. Collaborate with design and backend teams to deliver high-quality mobile experiences.",
        "status": "active",
    },
    {
        "title": "Junior Python Developer",
        "department": "Engineering",
        "location": "Pune (On-site)",
        "salaryRange": "₹6L – ₹10L / year",
        "experienceRequired": 1,
        "skillsRequired": ["Python", "Django", "PostgreSQL", "Git", "REST API"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "Great opportunity for freshers and junior developers. You will work on real features, get mentorship from senior devs, and grow fast.",
        "status": "active",
    },
    {
        "title": "Full Stack Developer (Node + React)",
        "department": "Engineering",
        "location": "Hyderabad (Hybrid)",
        "salaryRange": "₹14L – ₹22L / year",
        "experienceRequired": 3,
        "skillsRequired": ["React", "Node.js", "JavaScript", "TypeScript", "MongoDB", "REST API", "Docker"],
        "educationRequired": "bachelor",
        "certificationsRequired": [],
        "description": "Own features from database to UI. Build and maintain our customer-facing platform and internal tools using modern full-stack technologies.",
        "status": "archived",
    },
]

APPLICATION_STATUSES = ["applied", "under_review", "shortlisted", "interview", "selected", "rejected"]

# ─── Application plan: (candidate_idx, job_idx, status) ──────────────────────
# Covers diverse statuses across different candidates and jobs
APPLICATION_PLAN = [
    # Rahul Kumar — strong Python backend match
    (0, 0, "interview"),
    (0, 13, "shortlisted"),
    (0, 10, "under_review"),
    # Anjali Singh — React frontend
    (1, 1, "selected"),
    (1, 14, "shortlisted"),
    # Vikram Patel — Java microservices
    (2, 4, "interview"),
    (2, 10, "under_review"),
    (2, 0, "applied"),
    # Meera Nair — Data Science
    (3, 2, "shortlisted"),
    (3, 6, "applied"),
    # Siddharth Joshi — DevOps
    (4, 3, "selected"),
    (4, 10, "under_review"),
    # Divya Menon — UI/UX
    (5, 5, "interview"),
    (5, 1, "rejected"),
    # Aditya Rao — Django backend
    (6, 13, "applied"),
    (6, 0, "rejected"),
    (6, 14, "applied"),
    # Kavitha Reddy — ML/NLP PhD
    (7, 6, "selected"),
    (7, 2, "interview"),
    # Rohan Gupta — React Native
    (8, 7, "interview"),
    (8, 1, "under_review"),
    # Pooja Iyer — Cybersecurity
    (9, 8, "shortlisted"),
    # Aryan Shah — Go/Python
    (10, 10, "under_review"),
    (10, 0, "applied"),
    # Sneha Kulkarni — PM
    (11, 9, "interview"),
    # Nikhil Bansod — Java fresher
    (12, 4, "applied"),
    (12, 13, "applied"),
    # Lakshmi Priya — QA
    (13, 11, "shortlisted"),
    (13, 14, "applied"),
    # Karan Malhotra — Flutter
    (14, 12, "interview"),
    (14, 7, "applied"),
]


async def clear_collections():
    """Wipe all seeded data from every collection before re-seeding."""
    print("[SEED] Clearing ALL collections...")
    all_emails = (
        [r["email"] for r in RECRUITERS]
        + [h["email"] for h in HIRING_MANAGERS]
        + [c["email"] for c in CANDIDATES]
    )
    await db.users.delete_many({"email": {"$in": all_emails}})
    await db.jobs.delete_many({})          # clear all jobs
    await db.candidates.delete_many({})    # clear all candidate profiles
    await db.applications.delete_many({})  # clear all applications
    print("[SEED] All collections cleared.")


async def seed():
    print("\n====================================================")
    print("  ResuMatch — Database Seeder")
    print("====================================================\n")

    await clear_collections()

    # ── 1. Create Recruiters ──────────────────────────────────────────────────
    print("[1/4] Creating recruiters...")
    recruiter_ids = []
    hashed_pw = hash_password("Pass@1234")
    for rec in RECRUITERS:
        existing = await db.users.find_one({"email": rec["email"]})
        if existing:
            recruiter_ids.append(existing["_id"])
            continue
        res = await db.users.insert_one({
            "_id": new_id(),
            "name": rec["name"],
            "email": rec["email"],
            "password_hash": hashed_pw,
            "role": "recruiter",
            "is_active": True,
            "created_at": now_minus(days=random.randint(30, 60)),
            "updated_at": datetime.utcnow(),
        })
        recruiter_ids.append(res.inserted_id)
        print(f"   + Recruiter: {rec['name']} ({rec['email']})")

    # ── 1b. Create Hiring Managers ────────────────────────────────────────────
    print("\n[1b/4] Creating hiring managers...")
    for hm in HIRING_MANAGERS:
        existing = await db.users.find_one({"email": hm["email"]})
        if existing:
            continue
        await db.users.insert_one({
            "_id": new_id(),
            "name": hm["name"],
            "email": hm["email"],
            "password_hash": hashed_pw,
            "role": "hiring_manager",
            "is_active": True,
            "created_at": now_minus(days=random.randint(30, 60)),
            "updated_at": datetime.utcnow(),
        })
        print(f"   + Hiring Manager: {hm['name']} ({hm['email']})")

    # ── 2. Create Jobs ────────────────────────────────────────────────────────
    print(f"\n[2/4] Creating {len(JOBS)} jobs...")
    job_ids = []
    for i, job in enumerate(JOBS):
        # Distribute jobs across recruiters
        recruiter_id = recruiter_ids[i % len(recruiter_ids)]
        recruiter = RECRUITERS[i % len(RECRUITERS)]

        res = await db.jobs.insert_one({
            "_id": new_id(),
            "title": job["title"],
            "department": job["department"],
            "location": job["location"],
            "salaryRange": job["salaryRange"],
            "experienceRequired": job["experienceRequired"],
            "skillsRequired": job["skillsRequired"],
            "educationRequired": job["educationRequired"],
            "certificationsRequired": job.get("certificationsRequired", []),
            "description": job["description"],
            "status": job.get("status", "active"),
            "recruiterId": str(recruiter_id),   # MUST be string to match API query
            "recruiterName": recruiter["name"],
            "created_at": now_minus(days=random.randint(5, 25)),
            "updated_at": datetime.utcnow(),
        })
        job_ids.append(res.inserted_id)
        print(f"   + Job [{job.get('status','active').upper()}]: {job['title']}")

    # ── 3. Create Candidates ──────────────────────────────────────────────────
    print(f"\n[3/4] Creating {len(CANDIDATES)} candidates...")
    candidate_user_ids = []
    candidate_profile_ids = []

    for cand in CANDIDATES:
        # Create user account
        existing = await db.users.find_one({"email": cand["email"]})
        if existing:
            candidate_user_ids.append(existing["_id"])
        else:
            user_res = await db.users.insert_one({
                "_id": new_id(),
                "name": cand["name"],
                "email": cand["email"],
                "password_hash": hashed_pw,
                "role": "candidate",
                "is_active": True,
                "created_at": now_minus(days=random.randint(10, 45)),
                "updated_at": datetime.utcnow(),
            })
            candidate_user_ids.append(user_res.inserted_id)

        user_id = candidate_user_ids[-1]

        # Create candidate profile
        existing_profile = await db.candidates.find_one({"userId": str(user_id)})
        if existing_profile:
            candidate_profile_ids.append(existing_profile["_id"])
        else:
            prof_res = await db.candidates.insert_one({
                "_id": new_id(),
                "userId": str(user_id),
                "name": cand["name"],
                "email": cand["email"],
                "phone": cand["phone"],
                "skills": cand["skills"],
                "experience_years": cand["experience_years"],
                "education": cand["education"],
                "certifications": cand.get("certifications", []),
                "projects": [],
                "resumeUrl": None,  # No actual file — seeded profiles
                "resumeText": f"{cand['name']} - {cand['experience_years']} years experience. Skills: {', '.join(cand['skills'])}.",
                "created_at": now_minus(days=random.randint(10, 45)),
                "updated_at": datetime.utcnow(),
            })
            candidate_profile_ids.append(prof_res.inserted_id)

        print(f"   + Candidate: {cand['name']} | Skills: {len(cand['skills'])} | Exp: {cand['experience_years']}yrs")

    # ── 4. Create Applications ────────────────────────────────────────────────
    print(f"\n[4/4] Creating {len(APPLICATION_PLAN)} applications...")
    created_apps = 0

    for cand_idx, job_idx, status in APPLICATION_PLAN:
        cand = CANDIDATES[cand_idx]
        job = JOBS[job_idx]
        job_id = job_ids[job_idx]
        user_id = candidate_user_ids[cand_idx]
        profile_id = candidate_profile_ids[cand_idx]

        # Skip if already applied to this job
        existing_app = await db.applications.find_one({
            "candidateId": str(profile_id),
            "jobId": str(job_id),
        })
        if existing_app:
            continue

        # Calculate real match score
        candidate_data = {
            "skills": cand["skills"],
            "experience_years": cand["experience_years"],
            "education": cand["education"],
            "certifications": cand.get("certifications", []),
        }
        job_data = {
            "skillsRequired": job["skillsRequired"],
            "experienceRequired": job["experienceRequired"],
            "educationRequired": job["educationRequired"],
            "certificationsRequired": job.get("certificationsRequired", []),
        }
        match_result = calculate_match_score(candidate_data, job_data)

        await db.applications.insert_one({
            "_id": new_id(),
            "candidateId": str(profile_id),
            "candidateUserId": str(user_id),
            "candidateName": cand["name"],
            "candidateEmail": cand["email"],
            "candidateSkills": cand["skills"],
            "candidateExperience": cand["experience_years"],
            "jobId": str(job_id),
            "jobTitle": job["title"],
            "jobDepartment": job.get("department", ""),
            "jobLocation": job.get("location", ""),
            "matchScore": match_result["match_score"],
            "matchRank": match_result["rank"],
            "skillScore": match_result["skill_score"],
            "experienceScore": match_result["experience_score"],
            "educationScore": match_result["education_score"],
            "certificationScore": match_result["certification_score"],
            "matchedSkills": match_result.get("matched_skills", []),
            "status": status,
            "created_at": now_minus(days=random.randint(1, 20), hours=random.randint(0, 23)),
            "updated_at": datetime.utcnow(),
        })

        score = match_result["match_score"]
        rank = match_result["rank"]
        print(f"   + {cand['name']:20s} -> {job['title'][:35]:35s} | {score:5.1f}% ({rank:10s}) | {status}")
        created_apps += 1

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n====================================================")
    print(f"  SEED COMPLETE")
    print(f"  Recruiters  : {len(RECRUITERS)}")
    print(f"  Jobs        : {len(JOBS)}")
    print(f"  Candidates  : {len(CANDIDATES)}")
    print(f"  Applications: {created_apps}")
    print("====================================================")
    print("\nLogin credentials (all accounts):")
    print("  Password: Pass@1234")
    print("\nSample Recruiter accounts:")
    for r in RECRUITERS:
        print(f"  {r['email']}")
    print("\nSample Candidate accounts:")
    for c in CANDIDATES[:5]:
        print(f"  {c['email']}")
    print("  (and 10 more...)")
    print("\nOpen http://localhost:5173 to start exploring!\n")


if __name__ == "__main__":
    asyncio.run(seed())
