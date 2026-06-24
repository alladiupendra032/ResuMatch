# ResuMatch: AI-Driven Applicant Tracking & Talent Acquisition System (ATATS)
## Product Requirements Document (PRD)

**Version:** 1.0
**Prepared For:** Academic Full Stack Project
**Product Name:** ResuMatch
**Tech Stack:** React.js, Python (FastAPI), MongoDB

---

# 1. Executive Summary

ResuMatch is an AI-driven Applicant Tracking & Talent Acquisition System (ATATS) that streamlines recruitment by enabling candidates to upload resumes and allowing recruiters to efficiently identify the most suitable applicants using automated resume parsing, keyword analysis, and job matching algorithms.

The platform reduces manual screening effort by extracting structured information from resumes and comparing it with job requirements to generate relevance scores.

---

# 2. Problem Statement

Organizations receive hundreds of resumes for a single job opening.

Challenges:
- Manual resume screening is time-consuming.
- Recruiters may overlook qualified candidates.
- Different resume formats make evaluation difficult.
- Matching applicants against job requirements requires significant effort.

ResuMatch solves these problems through automated resume processing and intelligent candidate ranking.

---

# 3. Product Goals

## Business Goals
- Reduce recruiter screening time by 70%.
- Improve candidate-job matching accuracy.
- Centralize applicant management.

## User Goals
- Easy resume submission.
- Fast job application process.
- Transparent application tracking.

---

# 4. User Roles

## Candidate
- Register/Login
- Upload Resume
- Apply for Jobs
- Track Applications

## Recruiter
- Create Job Posts
- View Candidates
- Filter Applicants
- Download Resumes

## Hiring Manager
- Review Shortlisted Candidates
- Approve/Rejection Decisions

## Admin
- Manage Users
- Monitor System
- Generate Reports

---

# 5. Functional Requirements

## Authentication
### Candidate
- Sign Up
- Login
- Password Reset

### Recruiter
- Register Organization
- Login
- Manage Team

### Admin
- Full Access

---

# 6. Candidate Module

### Features
- Profile Creation
- Resume Upload
- Skill Management
- Education Details
- Work Experience
- Job Applications

### Resume Upload
Supported Formats:
- PDF
- DOCX

Maximum File Size:
- 10 MB

---

# 7. Resume Parsing Engine

## Objective

Extract structured information from resumes.

### Extracted Fields
- Name
- Email
- Phone Number
- Skills
- Education
- Experience
- Certifications
- Projects

### Python Libraries
- PyPDF2
- python-docx
- Regex
- spaCy (optional)

### Workflow
1. Upload Resume
2. Extract Text
3. Clean Text
4. Parse Sections
5. Store Structured Data
6. Calculate Match Score

---

# 8. Job Management Module

Recruiters can:

- Create Jobs
- Edit Jobs
- Archive Jobs
- View Applications

### Job Fields

- Job Title
- Department
- Experience Required
- Skills Required
- Location
- Salary Range
- Description

---

# 9. AI Matching Engine

## Objective

Match candidate resumes with job requirements.

### Matching Parameters

#### Skills Match
Weight: 50%

#### Experience Match
Weight: 25%

#### Education Match
Weight: 15%

#### Certifications Match
Weight: 10%

### Formula

Match Score =
(Skill Score × 0.5)
+ (Experience × 0.25)
+ (Education × 0.15)
+ (Certification × 0.10)

Final Score = 0–100

---

# 10. Candidate Ranking

Categories:

### Excellent Match
85–100

### Good Match
70–84

### Moderate Match
50–69

### Low Match
Below 50

---

# 11. Recruiter Dashboard

Features:

- Candidate Overview
- Job Statistics
- Match Analytics
- Shortlisted Candidates
- Interview Pipeline

Widgets:

- Total Applicants
- Active Jobs
- Interviews Scheduled
- Offers Released

---

# 12. Candidate Dashboard

Features:

- Profile Completion
- Uploaded Resume
- Applied Jobs
- Application Status

Statuses:

- Applied
- Under Review
- Shortlisted
- Interview
- Selected
- Rejected

---

# 13. Search & Filtering

Filters:

- Skills
- Experience
- Education
- Match Percentage
- Location

Sorting:

- Highest Match Score
- Latest Applications
- Experience

---

# 14. MongoDB Database Design

## Users Collection

```json
{
  "_id": "ObjectId",
  "role": "candidate",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password"
}
```

## Candidates Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "skills": ["Python","React"],
  "experience": 2,
  "education": "B.Tech",
  "resumeUrl": "cloud_storage_url"
}
```

## Jobs Collection

```json
{
  "_id": "ObjectId",
  "title": "Python Developer",
  "skillsRequired": ["Python","FastAPI"],
  "experienceRequired": 2
}
```

## Applications Collection

```json
{
  "_id": "ObjectId",
  "candidateId": "ObjectId",
  "jobId": "ObjectId",
  "matchScore": 88
}
```

---

# 15. REST API Design

## Authentication

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

---

## Resume APIs

POST /api/resume/upload

GET /api/resume/:id

DELETE /api/resume/:id

---

## Job APIs

POST /api/jobs

GET /api/jobs

GET /api/jobs/:id

PUT /api/jobs/:id

DELETE /api/jobs/:id

---

## Application APIs

POST /api/apply

GET /api/applications

GET /api/applications/:id

---

# 16. Frontend Architecture

## Technologies

- React.js
- Tailwind CSS
- Axios
- React Router
- Chart.js

### Components

Authentication
- Login
- Register

Candidate
- Profile
- Resume Upload
- Applications

Recruiter
- Dashboard
- Jobs
- Applicants

Admin
- Reports
- User Management

---

# 17. Backend Architecture

## Technologies

- Python
- FastAPI
- MongoDB
- PyPDF2
- python-docx

### Layers

Presentation Layer

API Layer

Business Logic Layer

Database Layer

Storage Layer

---

# 18. Cloud Storage

Options:

- AWS S3
- Cloudinary
- Firebase Storage

Stored Assets:

- Resume Files
- Documents

Database stores only file URLs.

---

# 19. Security Requirements

Authentication:
- JWT Tokens

Password Security:
- bcrypt hashing

Data Security:
- HTTPS
- Input Validation
- File Scanning

Role-Based Access Control:
- Candidate
- Recruiter
- Hiring Manager
- Admin

---

# 20. Non-Functional Requirements

Performance:
- Response < 2 seconds

Availability:
- 99.9% uptime

Scalability:
- 10,000+ users

Reliability:
- Daily backups

---

# 21. User Flow

Candidate:
Register → Upload Resume → Apply Job → Track Status

Recruiter:
Create Job → Receive Applications → Review Matches → Shortlist → Interview

---

# 22. Project Milestones

Phase 1
- Authentication
- Database Setup

Phase 2
- Resume Upload
- Parsing Engine

Phase 3
- Job Management

Phase 4
- Matching Engine

Phase 5
- Dashboard & Analytics

Phase 6
- Testing & Deployment

---

# 23. Deployment Architecture

Frontend:
- Vercel

Backend:
- Render / Railway

Database:
- MongoDB Atlas

Storage:
- Cloudinary / AWS S3

---

# 24. Future Enhancements

- AI Resume Recommendations
- Interview Scheduling
- Video Interviews
- AI Candidate Chatbot
- Job Recommendation Engine
- Email Notifications
- Analytics Dashboard
- Resume Quality Scoring

---

# 25. Acceptance Criteria

✓ Candidate can upload resume

✓ Resume text extracted successfully

✓ Recruiter can create jobs

✓ Match score generated

✓ Candidates ranked automatically

✓ Dashboard displays analytics

✓ Secure authentication implemented

✓ APIs tested successfully

---

# Conclusion

ResuMatch provides a complete AI-driven recruitment ecosystem that automates resume screening, improves hiring efficiency, and delivers accurate candidate-job matching through intelligent parsing and scoring mechanisms.
