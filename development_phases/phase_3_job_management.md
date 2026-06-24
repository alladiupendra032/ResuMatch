# Phase 3: Job Management

## 🎯 Objective
Implement Job post lifecycle management (CRUD operations) for recruiters, and enable candidate job browsing and application submission. Establish the foundational relationships between recruiters, jobs, candidates, and job applications.

---

## 🗄️ Database Design (MongoDB)

### `jobs` Collection
```json
{
  "_id": "ObjectId",
  "recruiterId": "ObjectId (Ref: users)",
  "title": "String",
  "department": "String",
  "experienceRequired": "Number (Years)",
  "skillsRequired": ["String"],
  "location": "String",
  "salaryRange": "String",
  "description": "String",
  "status": "active | archived",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### `applications` Collection
```json
{
  "_id": "ObjectId",
  "candidateId": "ObjectId (Ref: candidates)",
  "jobId": "ObjectId (Ref: jobs)",
  "matchScore": "Number (0-100) - Calculated in Phase 4",
  "status": "applied | under_review | shortlisted | interview | selected | rejected",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

---

## 🔌 API Specifications

### 1. Create a Job (Recruiter Only)
*   **Route:** `POST /api/jobs`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    ```json
    {
      "title": "Python Developer",
      "department": "Engineering",
      "experienceRequired": 2,
      "skillsRequired": ["Python", "FastAPI", "MongoDB"],
      "location": "Remote",
      "salaryRange": "$80,000 - $110,000",
      "description": "We are looking for a Python Developer..."
    }
    ```
*   **Response (201 Created):** Returns the created job document.

### 2. Fetch Jobs (Public/Candidate)
*   **Route:** `GET /api/jobs`
*   **Query Params (Optional):** `search`, `department`, `location`
*   **Response (200 OK):** Array of active job objects.

### 3. Update Job Details (Recruiter Only)
*   **Route:** `PUT /api/jobs/:id`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:** (Fields to update)
*   **Response (200 OK):** Updated job document.

### 4. Delete/Archive Job (Recruiter Only)
*   **Route:** `DELETE /api/jobs/:id`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):** `{"message": "Job successfully archived"}`

### 5. Apply for a Job (Candidate Only)
*   **Route:** `POST /api/apply`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    ```json
    {
      "jobId": "60d5ec4934d4220015a8b74a"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "Application submitted successfully",
      "application": {
        "id": "60d5ec4934d4220015a8b75f",
        "candidateId": "60d5ec4934d4220015a8b73e",
        "jobId": "60d5ec4934d4220015a8b74a",
        "status": "applied",
        "matchScore": null
      }
    }
    ```

---

## 📝 Phase 3 Checklist
- [ ] Create the Job Pydantic structures and validation code.
- [ ] Add routing and controller endpoints for Job CRUD operations in FastAPI.
- [ ] Incorporate role checks to restrict Job modification endpoints strictly to recruiters.
- [ ] Develop the job search/list API endpoints for candidates.
- [ ] Create the Application DB collections and the `/api/apply` submission route.
- [ ] Design Recruiter UI forms for job posting and job archiving.
- [ ] Design Candidate job list view with search inputs and detailed modal components.
- [ ] Create application buttons that trigger `/api/apply` and update the view state.

---

## 🔍 Verification Plan

### Automated Verification
*   **API Tests:** Test endpoints with different user roles to verify that Candidates cannot post jobs and Recruiters cannot apply for jobs.
    ```bash
    pytest backend/tests/test_jobs.py
    ```

### Manual Verification
*   Create a job posting using a Recruiter login.
*   Login as a Candidate, search/find the job posting, and click the **Apply** button.
*   Verify in MongoDB that a new entry appears in the `applications` collection representing the link between the candidate and the job.
