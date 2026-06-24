# Phase 5: Dashboard & Analytics

## 🎯 Objective
Create high-fidelity dashboards for recruiters and candidates. Build data visualization widgets (job statistics, applicant distribution) using Chart.js, implement real-time search, filtering, and sorting of candidates, and create pipeline status transition controls for recruiters.

---

## 🖥️ UI & Dashboard Layouts

### 1. Recruiter Dashboard & Analytics
Designed to give recruiters a complete view of active campaigns and candidate pipelines.

*   **KPI Summary Widgets:**
    *   *Total Applicants:* Count of overall applications.
    *   *Active Jobs:* Count of jobs with `status = "active"`.
    *   *Interviews Scheduled:* Count of applications in the `interview` state.
    *   *Offers Released:* Count of applications in the `selected` state.
*   **Match Analytics Chart (Chart.js):**
    *   A bar chart showing applicant counts grouped by match score category (Excellent, Good, Moderate, Low) for selected jobs.
    *   A pie chart indicating status distributions (Applied, Review, Interview, Hired, Rejected).
*   **Applicant Pipeline Board (Kanban or Table View):**
    *   A drag-and-drop board or table allowing recruiters to move candidates between pipeline stages:
        $$\text{Applied} \longrightarrow \text{Under Review} \longrightarrow \text{Shortlisted} \longrightarrow \text{Interview} \longrightarrow \text{Selected / Rejected}$$

### 2. Candidate Dashboard
Designed for candidates to manage their resume and track their application progress.

*   **Profile Completion Tracker:** Visual progress bar indicating complete profile sections (Resume Uploaded: +30%, Contact details filled: +20%, Skills matched: +30%, Education added: +20%).
*   **Application Progress Cards:** Clean list cards detailing:
    *   Job Title & Department.
    *   Date Applied.
    *   Current Status Indicator (with color codes).
    *   Relevance Match Score (if visibility is enabled by recruiter).

---

## 🔍 Search, Filter, & Sorting Engine
A robust client-side or server-side engine to quickly parse candidates.

### Query Parameters for `/api/applications` (Recruiter endpoint):
*   `jobId`: Filter applications for a specific job.
*   `minScore` / `maxScore`: Range queries on match percentages.
*   `skills`: Substring or exact set matching on candidate skills.
*   `experienceYears`: Minimum years of experience.
*   `sortBy`: `matchScore` (desc), `created_at` (desc), `experience_years` (desc).

---

## 🔌 API Specifications (Analytics)

### Get Recruiter Analytics Overview
*   **Route:** `GET /api/recruiter/analytics`
*   **Headers:** `Authorization: Bearer <token>` (Recruiter Only)
*   **Response (200 OK):**
    ```json
    {
      "kpis": {
        "total_applicants": 248,
        "active_jobs": 12,
        "interviews_scheduled": 14,
        "offers_released": 5
      },
      "match_distribution": {
        "excellent": 32,
        "good": 84,
        "moderate": 100,
        "low": 32
      }
    }
    ```

### Update Application Status
*   **Route:** `PATCH /api/applications/:id/status`
*   **Headers:** `Authorization: Bearer <token>` (Recruiter/Hiring Manager Only)
*   **Request Body:**
    ```json
    {
      "status": "interview"
    }
    ```
*   **Response (200 OK):** Returns the updated application object.

---

## 📝 Phase 5 Checklist
- [ ] Implement aggregation pipelines in FastAPI/MongoDB for recruiter KPIs and chart data.
- [ ] Create `/api/recruiter/analytics` endpoint.
- [ ] Create `/api/applications/:id/status` update endpoint with authorization check.
- [ ] Install and configure `chart.js` (and `react-chartjs-2`) in the React project.
- [ ] Build Recruiter KPI cards and visual analytics chart panels.
- [ ] Implement the applicant pipeline management list/board (with status updating controls).
- [ ] Create Candidate Dashboard page displaying profile stats and application history cards.
- [ ] Build multi-criteria filter and sort controls (skills search, experience filters, sort selectors) on the Recruiter view.

---

## 🔍 Verification Plan

### Automated Verification
*   **Aggregation Tests:** Verify that database query aggregations return accurate counts and group by calculations accurately handle empty collections.
    ```bash
    pytest backend/tests/test_analytics.py
    ```

### Manual Verification
*   Log in as a Recruiter, update several candidate application statuses (e.g. from "Applied" to "Interview").
*   Verify that the Candidate's dashboard automatically reflects the status change immediately.
*   Verify that the Recruiter analytics dashboard widgets and charts update to show the new count distributions correctly.
