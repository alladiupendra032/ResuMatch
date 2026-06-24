# ResuMatch — AI-Powered Applicant Tracking System

ResuMatch is a full-stack recruitment platform that uses an AI matching engine to automatically score and rank candidates against job requirements. It eliminates manual resume screening by computing a weighted match score the moment a candidate applies, giving recruiters and hiring managers an instant, data-driven shortlist.

---

## Tech Stack

**Backend**
- FastAPI (Python 3.11) — REST API framework
- MongoDB + Motor — async NoSQL database
- PyJWT + bcrypt — JWT authentication and password hashing
- pdfplumber / python-docx — resume file parsing
- Pydantic v2 — request/response validation
- Uvicorn — ASGI server
- pytest + pytest-asyncio — 29 automated tests

**Frontend**
- React 18 + Vite — component-based UI
- React Router v6 — client-side routing
- Axios — HTTP client with JWT interceptors
- Chart.js + react-chartjs-2 — analytics charts
- react-hot-toast — notifications
- Vanilla CSS — custom glassmorphism dark-mode design system

**Database**
- MongoDB (local: mongodb://localhost:27017)
- Database name: resumatch
- Collections: users, jobs, candidates, applications

---

## How the AI Matching Works

Every time a candidate applies, the engine computes a score using four weighted criteria:

| Criteria | Weight |
|----------|--------|
| Skills match | 50% |
| Experience years | 25% |
| Education level | 15% |
| Certifications | 10% |

Score ranges produce a rank label:
- 85% and above — Excellent Match
- 70 to 84% — Good Match
- 50 to 69% — Moderate Match
- Below 50% — Low Match

---

## User Roles

### Candidate
Candidates register, upload their resume (PDF or DOCX), and apply for jobs. The system parses their resume automatically — extracting skills, experience, education, and certifications. Once they apply, the AI score is computed instantly and they can track the status of each application through the hiring pipeline.

**Portal:** `/candidate/*`
**Pages:** Dashboard, My Profile, Browse Jobs, My Applications

### Recruiter
Recruiters post job openings with required skills, experience, education, and certifications. When candidates apply, their applications appear ranked by AI match score — highest first. Recruiters can move candidates through six pipeline stages: applied, under review, shortlisted, interview, selected, or rejected. Their analytics dashboard shows KPIs, match quality distribution, and pipeline status specific to their own job postings.

**Portal:** `/recruiter/*`
**Pages:** Dashboard, Manage Jobs, Applicants

### Hiring Manager
Hiring managers have a platform-wide view. Unlike recruiters who only see their own jobs and applicants, a hiring manager sees everything — all jobs posted by all recruiters, all applications across the company, and company-wide analytics. They can update the pipeline status of any application and use the detail panel to review each candidate's full match score breakdown.

**Portal:** `/hm/*`
**Pages:** Dashboard, All Jobs, All Applications

---

## Role Comparison

| Feature | Candidate | Recruiter | Hiring Manager |
|---------|-----------|-----------|----------------|
| Upload resume | Yes | No | No |
| Apply for jobs | Yes | No | No |
| Post job openings | No | Yes | No |
| View own applicants | No | Yes | No |
| View all applicants | No | No | Yes |
| Update pipeline status | No | Own jobs | All jobs |
| Analytics scope | Own applications | Own jobs only | Entire platform |

---

## Demo Accounts

All accounts use password: **Pass@1234**

| Role | Email |
|------|-------|
| Hiring Manager | rajesh.hm@techcorp.com |
| Hiring Manager | deepa.hm@globalsoft.com |
| Recruiter | priya@techcorp.com |
| Recruiter | arjun@startupxyz.com |
| Recruiter | sarah@globalsoft.com |
| Candidate | rahul.kumar@gmail.com |
| Candidate | anjali.singh@gmail.com |
| Candidate | vikram.patel@gmail.com |
| Candidate | meera.nair@gmail.com |
| Candidate | sid.joshi@gmail.com |

---

## Running the Project

**Backend**
```bash
cd backend
pip install -r requirements.txt
python seed_data.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev -- --host
```

Open http://localhost:5173 in your browser.
API docs available at http://localhost:8000/docs
