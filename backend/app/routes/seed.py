"""
One-time seed route — call GET /api/seed?secret=resumatch2024 to populate the database.
Remove this file after seeding is done.
"""
import random
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from app.database import db
from app.utils.security import get_password_hash
from app.utils.matching_engine import compute_match

router = APIRouter()

SEED_SECRET = "resumatch2024"

# ── Data ─────────────────────────────────────────────────────────────────────
RECRUITERS = [
    {"name": "Priya Sharma",   "email": "priya@techcorp.com",   "company": "TechCorp India"},
    {"name": "Arjun Mehta",    "email": "arjun@startupxyz.com", "company": "StartupXYZ"},
    {"name": "Sarah Williams", "email": "sarah@globalsoft.com", "company": "GlobalSoft"},
]
HIRING_MANAGERS = [
    {"name": "Rajesh Verma",  "email": "rajesh.hm@techcorp.com"},
    {"name": "Deepa Nambiar", "email": "deepa.hm@globalsoft.com"},
]
CANDIDATES_DATA = [
    {"name": "Rahul Kumar",     "email": "rahul.kumar@gmail.com",    "skills": ["Python","FastAPI","MongoDB","Docker","Redis","SQL","Git"],               "exp": 3, "edu_level": 2, "edu": "B.Tech CS - IIT Bombay",        "certs": ["AWS Developer Associate","Python Professional"]},
    {"name": "Anjali Singh",    "email": "anjali.singh@gmail.com",   "skills": ["React","TypeScript","Node.js","GraphQL","CSS","Redux","Webpack"],         "exp": 2, "edu_level": 2, "edu": "B.Tech IT - NIT Trichy",          "certs": ["AWS Cloud Practitioner"]},
    {"name": "Vikram Patel",    "email": "vikram.patel@gmail.com",   "skills": ["Java","Spring Boot","Kafka","Microservices","Docker","PostgreSQL","Maven"],"exp": 5, "edu_level": 3, "edu": "M.Tech CS - BITS Pilani",         "certs": ["Oracle Java SE","AWS Solutions Architect"]},
    {"name": "Meera Nair",      "email": "meera.nair@gmail.com",     "skills": ["Python","ML","TensorFlow","Pandas","Scikit-learn","SQL","Spark"],          "exp": 4, "edu_level": 3, "edu": "M.Sc Data Science - IISc",        "certs": ["Google ML Engineer","TensorFlow Developer"]},
    {"name": "Siddharth Joshi", "email": "sid.joshi@gmail.com",      "skills": ["DevOps","Kubernetes","Terraform","Docker","AWS","CI/CD","Ansible","Helm","Prometheus"], "exp": 6, "edu_level": 2, "edu": "B.Tech - VIT Vellore", "certs": ["CKA","AWS DevOps Engineer","Terraform Associate"]},
    {"name": "Divya Menon",     "email": "divya.menon@gmail.com",    "skills": ["Figma","UI/UX","Adobe XD","Sketch","Prototyping","User Research","CSS"],   "exp": 3, "edu_level": 2, "edu": "B.Des - NID Ahmedabad",          "certs": ["Google UX Design"]},
    {"name": "Aditya Rao",      "email": "aditya.rao@gmail.com",     "skills": ["Python","Django","PostgreSQL","REST API","Celery","Redis","Docker"],       "exp": 2, "edu_level": 2, "edu": "B.Tech CS - Manipal University",  "certs": []},
    {"name": "Kavitha Reddy",   "email": "kavitha.reddy@gmail.com",  "skills": ["NLP","PyTorch","Deep Learning","Transformers","Python","HuggingFace","BERT"],"exp": 5, "edu_level": 4, "edu": "PhD AI - IIT Hyderabad",         "certs": ["DeepLearning.AI Specialization"]},
    {"name": "Rohan Gupta",     "email": "rohan.gupta@gmail.com",    "skills": ["React Native","Firebase","Redux","JavaScript","iOS","Android","Expo"],     "exp": 3, "edu_level": 2, "edu": "B.Tech CS - Amity University",    "certs": ["Google Associate Android Developer"]},
    {"name": "Pooja Iyer",      "email": "pooja.iyer@gmail.com",     "skills": ["Cybersecurity","Pen Testing","SIEM","Nessus","Wireshark","Linux","Python"], "exp": 4, "edu_level": 2, "edu": "B.Tech IT - Anna University",     "certs": ["CEH","CompTIA Security+","OSCP"]},
    {"name": "Aryan Shah",      "email": "aryan.shah@gmail.com",     "skills": ["Go","Python","Docker","Kafka","gRPC","PostgreSQL","Redis"],                "exp": 4, "edu_level": 2, "edu": "B.Tech CS - DJ Sanghvi",          "certs": ["GCP Professional Developer"]},
    {"name": "Sneha Kulkarni",  "email": "sneha.kulkarni@gmail.com", "skills": ["Product Management","Agile","Scrum","Jira","Roadmapping","SQL","Figma"],   "exp": 5, "edu_level": 3, "edu": "MBA - IIM Bangalore",             "certs": ["PMP","CSPO"]},
    {"name": "Nikhil Bansod",   "email": "nikhil.bansod@gmail.com",  "skills": ["Java","Spring","MySQL","Hibernate","Maven","REST API","JUnit"],            "exp": 1, "edu_level": 2, "edu": "B.Tech CS - RCOEM Nagpur",        "certs": []},
    {"name": "Lakshmi Priya",   "email": "lakshmi.priya@gmail.com",  "skills": ["Selenium","Java","TestNG","API Testing","JIRA","Postman","Cucumber"],      "exp": 3, "edu_level": 2, "edu": "B.Tech IT - SRM University",      "certs": ["ISTQB Foundation"]},
    {"name": "Karan Malhotra",  "email": "karan.malhotra@gmail.com", "skills": ["Flutter","Dart","Firebase","REST API","Provider","iOS","Android"],         "exp": 2, "edu_level": 2, "edu": "B.Tech CS - Thapar University",   "certs": ["Google Flutter Developer"]},
]
JOBS_DATA = [
    {"title": "Senior Python Backend Developer",   "dept": "Engineering",       "loc": "Bangalore, India",  "salary": "12-18 LPA", "exp": 3, "skills": ["Python","FastAPI","MongoDB","Docker","PostgreSQL","Redis","Git"],     "edu": "Bachelor's", "edu_level": 2, "certs": ["AWS Developer"],            "rec_idx": 0},
    {"title": "React Frontend Engineer",           "dept": "Engineering",       "loc": "Hyderabad, India",  "salary": "10-15 LPA", "exp": 2, "skills": ["React","TypeScript","Node.js","GraphQL","CSS","Redux"],               "edu": "Bachelor's", "edu_level": 2, "certs": [],                           "rec_idx": 0},
    {"title": "Data Scientist — ML Platform",      "dept": "Data Science",      "loc": "Pune, India",       "salary": "14-20 LPA", "exp": 3, "skills": ["Python","ML","TensorFlow","Pandas","Scikit-learn","SQL"],             "edu": "Master's",   "edu_level": 3, "certs": ["Google ML Engineer"],       "rec_idx": 1},
    {"title": "DevOps / SRE Engineer",             "dept": "Infrastructure",    "loc": "Bangalore, India",  "salary": "15-22 LPA", "exp": 4, "skills": ["DevOps","Kubernetes","Terraform","Docker","AWS","CI/CD","Ansible","Helm","Prometheus"], "edu": "Bachelor's", "edu_level": 2, "certs": ["CKA","AWS DevOps Engineer"], "rec_idx": 1},
    {"title": "Java Microservices Engineer",       "dept": "Engineering",       "loc": "Chennai, India",    "salary": "12-18 LPA", "exp": 4, "skills": ["Java","Spring Boot","Kafka","Microservices","Docker","PostgreSQL"],   "edu": "Bachelor's", "edu_level": 2, "certs": ["Oracle Java SE"],           "rec_idx": 0},
    {"title": "UI/UX Designer",                    "dept": "Design",            "loc": "Mumbai, India",     "salary": "8-13 LPA",  "exp": 2, "skills": ["Figma","UI/UX","Adobe XD","Prototyping","User Research"],             "edu": "Bachelor's", "edu_level": 2, "certs": [],                           "rec_idx": 2},
    {"title": "Machine Learning Engineer — NLP",   "dept": "AI/ML",             "loc": "Bangalore, India",  "salary": "18-28 LPA", "exp": 4, "skills": ["NLP","PyTorch","Deep Learning","Transformers","Python","HuggingFace"], "edu": "Master's",  "edu_level": 3, "certs": ["DeepLearning.AI Specialization"], "rec_idx": 2},
    {"title": "Mobile Developer (React Native)",   "dept": "Mobile",            "loc": "Gurgaon, India",    "salary": "10-16 LPA", "exp": 2, "skills": ["React Native","Firebase","Redux","JavaScript","iOS","Android"],       "edu": "Bachelor's", "edu_level": 2, "certs": [],                           "rec_idx": 1},
    {"title": "Cybersecurity Analyst",             "dept": "Security",          "loc": "Hyderabad, India",  "salary": "12-18 LPA", "exp": 3, "skills": ["Cybersecurity","Pen Testing","SIEM","Nessus","Wireshark","Linux"],    "edu": "Bachelor's", "edu_level": 2, "certs": ["CEH","CompTIA Security+"], "rec_idx": 0},
    {"title": "Product Manager",                   "dept": "Product",           "loc": "Bangalore, India",  "salary": "18-28 LPA", "exp": 4, "skills": ["Product Management","Agile","Scrum","Jira","Roadmapping","SQL"],     "edu": "Master's",   "edu_level": 3, "certs": ["PMP"],                      "rec_idx": 2},
    {"title": "Backend Engineer — Go / Python",    "dept": "Engineering",       "loc": "Remote",            "salary": "14-20 LPA", "exp": 3, "skills": ["Go","Python","Docker","Kafka","gRPC","PostgreSQL","Redis"],           "edu": "Bachelor's", "edu_level": 2, "certs": [],                           "rec_idx": 1},
    {"title": "QA Automation Engineer",            "dept": "Quality Assurance", "loc": "Pune, India",       "salary": "8-13 LPA",  "exp": 2, "skills": ["Selenium","Java","TestNG","API Testing","JIRA","Postman","Cucumber"], "edu": "Bachelor's", "edu_level": 2, "certs": ["ISTQB Foundation"],         "rec_idx": 2},
    {"title": "Flutter Mobile Developer",          "dept": "Mobile",            "loc": "Noida, India",      "salary": "10-15 LPA", "exp": 2, "skills": ["Flutter","Dart","Firebase","REST API","Provider","iOS","Android"],   "edu": "Bachelor's", "edu_level": 2, "certs": [],                           "rec_idx": 0},
    {"title": "Junior Python Developer",           "dept": "Engineering",       "loc": "Bangalore, India",  "salary": "5-8 LPA",   "exp": 1, "skills": ["Python","Django","PostgreSQL","REST API","Git"],                     "edu": "Bachelor's", "edu_level": 2, "certs": [],                           "rec_idx": 1},
    {"title": "Full Stack Developer (Node+React)", "dept": "Engineering",       "loc": "Mumbai, India",     "salary": "10-16 LPA", "exp": 3, "skills": ["React","Node.js","MongoDB","TypeScript","Docker","REST API"],         "edu": "Bachelor's", "edu_level": 2, "certs": [],                           "rec_idx": 2, "archived": True},
]
APPLICATIONS_MAP = [
    (0,  0,  "interview"),
    (0,  13, "shortlisted"),
    (0,  10, "under_review"),
    (1,  1,  "selected"),
    (1,  14, "shortlisted"),
    (2,  4,  "interview"),
    (2,  10, "under_review"),
    (2,  0,  "applied"),
    (3,  2,  "shortlisted"),
    (3,  6,  "applied"),
    (4,  3,  "selected"),
    (4,  10, "under_review"),
    (5,  5,  "interview"),
    (5,  1,  "rejected"),
    (6,  13, "applied"),
    (6,  0,  "rejected"),
    (6,  14, "applied"),
    (7,  6,  "selected"),
    (7,  2,  "interview"),
    (8,  7,  "interview"),
    (8,  1,  "under_review"),
    (9,  8,  "shortlisted"),
    (10, 10, "under_review"),
    (10, 0,  "applied"),
    (11, 9,  "interview"),
    (12, 4,  "applied"),
    (12, 13, "applied"),
    (13, 11, "shortlisted"),
    (13, 14, "applied"),
    (14, 12, "interview"),
    (14, 7,  "applied"),
]

def new_id(): return ObjectId()
def now_minus(days=0, hours=0):
    return datetime.utcnow() - timedelta(days=days, hours=hours)


@router.get("/api/seed")
async def seed_database(secret: str = Query(...)):
    if secret != SEED_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    results = {"recruiters": 0, "hiring_managers": 0, "jobs": 0, "candidates": 0, "applications": 0, "skipped": 0}

    # Clear existing data
    all_emails = [r["email"] for r in RECRUITERS] + [h["email"] for h in HIRING_MANAGERS] + [c["email"] for c in CANDIDATES_DATA]
    await db.users.delete_many({"email": {"$in": all_emails}})
    await db.jobs.delete_many({})
    await db.candidates.delete_many({})
    await db.applications.delete_many({})

    hashed_pw = get_password_hash("Pass@1234")

    # Create recruiters
    recruiter_ids = []
    for rec in RECRUITERS:
        oid = new_id()
        await db.users.insert_one({"_id": oid, "name": rec["name"], "email": rec["email"],
            "password_hash": hashed_pw, "role": "recruiter", "is_active": True,
            "created_at": now_minus(days=random.randint(30,60)), "updated_at": datetime.utcnow()})
        recruiter_ids.append(oid)
        results["recruiters"] += 1

    # Create hiring managers
    for hm in HIRING_MANAGERS:
        await db.users.insert_one({"_id": new_id(), "name": hm["name"], "email": hm["email"],
            "password_hash": hashed_pw, "role": "hiring_manager", "is_active": True,
            "created_at": now_minus(days=random.randint(30,60)), "updated_at": datetime.utcnow()})
        results["hiring_managers"] += 1

    # Create jobs
    job_ids = []
    for j in JOBS_DATA:
        rec = RECRUITERS[j["rec_idx"]]
        rid = recruiter_ids[j["rec_idx"]]
        oid = new_id()
        await db.jobs.insert_one({"_id": oid, "title": j["title"], "department": j["dept"],
            "location": j["loc"], "salaryRange": j["salary"], "experienceRequired": j["exp"],
            "skillsRequired": j["skills"], "educationRequired": j["edu"],
            "educationLevel": j.get("edu_level", 2), "certificationsRequired": j["certs"],
            "description": f"We are looking for a talented {j['title']} to join our team.",
            "status": "archived" if j.get("archived") else "active",
            "recruiterId": str(rid), "recruiterName": rec["name"],
            "created_at": now_minus(days=random.randint(5,30)), "updated_at": datetime.utcnow()})
        job_ids.append(oid)
        results["jobs"] += 1

    # Create candidates
    candidate_ids = []
    for c in CANDIDATES_DATA:
        # Create user account
        user_oid = new_id()
        await db.users.insert_one({"_id": user_oid, "name": c["name"], "email": c["email"],
            "password_hash": hashed_pw, "role": "candidate", "is_active": True,
            "created_at": now_minus(days=random.randint(10,40)), "updated_at": datetime.utcnow()})
        # Create candidate profile
        cand_oid = new_id()
        await db.candidates.insert_one({"_id": cand_oid, "userId": str(user_oid),
            "name": c["name"], "email": c["email"], "phone": "+91-98765-43210",
            "skills": c["skills"], "experience_years": float(c["exp"]),
            "education": [c["edu"]], "education_level": c["edu_level"],
            "certifications": c["certs"], "projects": [],
            "resumeUrl": None,
            "created_at": now_minus(days=random.randint(5,20)), "updated_at": datetime.utcnow()})
        candidate_ids.append((cand_oid, user_oid))
        results["candidates"] += 1

    # Create applications
    for cand_idx, job_idx, status in APPLICATIONS_MAP:
        c = CANDIDATES_DATA[cand_idx]
        j = JOBS_DATA[job_idx]
        cand_oid, user_oid = candidate_ids[cand_idx]
        job_oid = job_ids[job_idx]

        cand_profile = {"skills": c["skills"], "experience_years": float(c["exp"]),
                        "education_level": c["edu_level"], "certifications": c["certs"]}
        job_req = {"skillsRequired": j["skills"], "experienceRequired": j["exp"],
                   "educationLevel": j.get("edu_level", 2), "certificationsRequired": j["certs"]}
        match = compute_match(cand_profile, job_req)

        await db.applications.insert_one({
            "_id": new_id(),
            "candidateId": str(cand_oid), "candidateUserId": str(user_oid),
            "candidateName": c["name"], "candidateEmail": c["email"],
            "candidateSkills": c["skills"], "candidateExperience": c["exp"],
            "jobId": str(job_oid), "jobTitle": j["title"],
            "jobDepartment": j["dept"], "jobLocation": j["loc"],
            "matchScore": match["matchScore"], "matchRank": match["matchRank"],
            "skillScore": match["skillScore"], "experienceScore": match["experienceScore"],
            "educationScore": match["educationScore"], "certificationScore": match["certificationScore"],
            "matchedSkills": match.get("matchedSkills", []),
            "status": status,
            "created_at": now_minus(days=random.randint(1,10), hours=random.randint(0,12)),
            "updated_at": datetime.utcnow(),
        })
        results["applications"] += 1

    return {
        "message": "Database seeded successfully!",
        "counts": results,
        "login_password": "Pass@1234",
        "accounts": {
            "hiring_managers": [h["email"] for h in HIRING_MANAGERS],
            "recruiters": [r["email"] for r in RECRUITERS],
            "candidates": [c["email"] for c in CANDIDATES_DATA[:5]]
        }
    }
