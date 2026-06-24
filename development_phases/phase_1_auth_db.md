# Phase 1: Authentication & Database Setup

## 🎯 Objective
Establish the foundational infrastructure of ResuMatch by setting up the MongoDB connection layer, implementing secure JWT-based authentication with role-based authorization, and bootstrapping both the FastAPI backend and React frontend.

---

## 🗄️ Database Design (MongoDB)
We will define the schema structure for user registration and session management.

### `users` Collection
```json
{
  "_id": "ObjectId",
  "role": "candidate | recruiter | hiring_manager | admin",
  "name": "String",
  "email": "String (Unique, Indexed)",
  "password_hash": "String (bcrypt hashed)",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

---

## 🔌 API Specifications
All authentication routes reside under `/api/auth/`.

### 1. User Registration
*   **Route:** `POST /api/auth/register`
*   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "SecurePassword123",
      "role": "candidate"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": "60d5ec4934d4220015a8b73d",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "candidate"
      }
    }
    ```

### 2. User Login
*   **Route:** `POST /api/auth/login`
*   **Request Body:**
    ```json
    {
      "email": "john@example.com",
      "password": "SecurePassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer",
      "user": {
        "id": "60d5ec4934d4220015a8b73d",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "candidate"
      }
    }
    ```

### 3. User Logout
*   **Route:** `POST /api/auth/logout`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "message": "Logged out successfully"
    }
    ```

---

## 🏗️ Architecture & Implementation Details

### Backend (FastAPI)
1.  **Directory Structure:**
    ```text
    backend/
    ├── app/
    │   ├── main.py                # App entrypoint & CORS config
    │   ├── config.py              # Environment variables loading (pydantic-settings)
    │   ├── database.py            # MongoDB connection logic (Motor Client)
    │   ├── models/
    │   │   ├── user.py            # Pydantic schemas (UserCreate, UserResponse, UserDB)
    │   ├── routes/
    │   │   ├── auth.py            # Registration, login, logout endpoints
    │   └── utils/
    │       ├── security.py        # bcrypt hashing and JWT encoding/decoding
    │       └── dependencies.py    # Current user extraction and role check dependencies
    ├── .env
    └── requirements.txt
    ```
2.  **Security Measures:**
    *   Hashed passwords using `passlib` with the `bcrypt` scheme.
    *   JWT credentials signed with a strong `JWT_SECRET_KEY` and configured expiration (e.g., 24 hours).
    *   Role validation dependencies to restrict specific routes to `recruiter`, `hiring_manager`, or `admin`.

### Frontend (React)
1.  **Directory Structure:**
    ```text
    frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Common/
    │   │   │   ├── Input.jsx      # Reusable form inputs
    │   │   │   └── Button.jsx     # Reusable custom buttons
    │   │   └── Layout/
    │   │       ├── Navbar.jsx     # Header navigation indicating auth status
    │   │       └── Sidebar.jsx    # Dash side nav (role dependent)
    │   ├── context/
    │   │   └── AuthContext.jsx    # AuthProvider for handling tokens & user state
    │   ├── pages/
    │   │   ├── Login.jsx          # Login view
    │   │   └── Register.jsx       # Register view
    │   ├── services/
    │   │   └── api.js             # Axios client instance with request interceptor for JWT
    │   ├── App.jsx                # Router setup and Route guarding
    │   └── index.css              # Custom styling definitions
    ```
2.  **State Management:**
    *   `AuthContext` maintains the current authenticated user object and handles login/logout behaviors.
    *   Axios interceptors dynamically append the JWT token to the `Authorization` header on every request.
    *   Routes are wrapped in protective layout guards (e.g., `<ProtectedRoute allowedRoles={['recruiter']} />`).

---

## 📝 Phase 1 Checklist
- [ ] Initialize Python FastAPI project and configure `.env` configurations.
- [ ] Implement Motor client connection with connection pooling to MongoDB Atlas or local instance.
- [ ] Code authentication models (Pydantic validation schemas).
- [ ] Implement bcrypt password utility functions and JWT generator/validator helpers.
- [ ] Expose `/api/auth/register` and `/api/auth/login` REST endpoints.
- [ ] Initialize React frontend using Vite and install basic routing dependencies (`react-router-dom`, `axios`).
- [ ] Set up global style files and themes.
- [ ] Implement UI views for Login and Registration with active input verification.
- [ ] Configure `AuthContext` to persist authorization status using `localStorage`.

---

## 🔍 Verification Plan

### Automated Verification
*   **Backend Integration Tests:** Write pytest scripts targeting registering a user, logging in with valid/invalid credentials, and attempting to access protected resources with/without a JWT.
    ```bash
    pytest backend/tests/test_auth.py
    ```

### Manual Verification
*   Utilize Postman/Swagger UI (`/docs`) to test validation schemas and JWT responses.
*   Interact with the Register and Login UI, checking if incorrect credentials yield user-friendly alerts. Verify redirects to role-appropriate pages occur upon login.
