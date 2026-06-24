import pytest
from app.utils.parser import (
    extract_email, extract_phone, extract_name,
    extract_skills, extract_experience_years, extract_certifications,
    parse_resume,
)

SAMPLE_RESUME_TEXT = """
John Doe
johndoe@example.com
+1-555-123-4567

Summary:
Experienced software developer with 5 years of experience in Python, React, and MongoDB.

Skills:
Python, FastAPI, React, MongoDB, Docker, AWS, PostgreSQL, Git

Experience:
Senior Developer at TechCorp 2021-present
- Built RESTful APIs using FastAPI and Python

Junior Developer at StartupXYZ 2019-2021
- Developed React frontend applications

Education:
B.Tech in Computer Science, State University, 2019

Certifications:
AWS Certified Developer
"""


def test_extract_email():
    email = extract_email(SAMPLE_RESUME_TEXT)
    assert email == "johndoe@example.com"


def test_extract_phone():
    phone = extract_phone(SAMPLE_RESUME_TEXT)
    assert phone != ""  # Should find some phone number


def test_extract_name():
    name = extract_name(SAMPLE_RESUME_TEXT)
    assert name == "John Doe"


def test_extract_skills():
    skills = extract_skills(SAMPLE_RESUME_TEXT)
    skills_lower = [s.lower() for s in skills]
    assert "python" in skills_lower
    assert "react" in skills_lower
    assert "mongodb" in skills_lower


def test_extract_experience_years():
    years = extract_experience_years(SAMPLE_RESUME_TEXT)
    # Should detect "5 years of experience"
    assert years >= 2.0


def test_extract_certifications():
    certs = extract_certifications(SAMPLE_RESUME_TEXT)
    assert len(certs) > 0


def test_parse_resume_full():
    file_bytes = SAMPLE_RESUME_TEXT.encode("utf-8")
    result = parse_resume(file_bytes, "resume.txt")
    assert result["name"] == "John Doe"
    assert result["email"] == "johndoe@example.com"
    assert len(result["skills"]) > 0
    assert result["experience_years"] >= 2.0
