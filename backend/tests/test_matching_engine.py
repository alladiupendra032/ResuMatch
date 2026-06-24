import pytest
from app.utils.matching_engine import (
    calculate_skills_score,
    calculate_experience_score,
    calculate_education_score,
    calculate_certifications_score,
    calculate_match_score,
)


def test_skills_score_perfect_match():
    score = calculate_skills_score(["Python", "React", "MongoDB"], ["Python", "React", "MongoDB"])
    assert score == 100.0


def test_skills_score_partial_match():
    score = calculate_skills_score(["Python", "React"], ["Python", "React", "MongoDB"])
    assert abs(score - 66.67) < 1.0  # 2/3 skills


def test_skills_score_no_match():
    score = calculate_skills_score(["Java", "Spring"], ["Python", "React"])
    assert score == 0.0


def test_skills_score_no_requirements():
    score = calculate_skills_score(["Python"], [])
    assert score == 100.0


def test_experience_score_meets_requirement():
    score = calculate_experience_score(5.0, 3.0)
    assert score == 100.0


def test_experience_score_below_requirement():
    score = calculate_experience_score(2.0, 4.0)
    assert score == 50.0


def test_experience_score_no_requirement():
    score = calculate_experience_score(0.0, 0.0)
    assert score == 100.0


def test_education_score_meets_requirement():
    education = [{"degree": "B.Tech in Computer Science"}]
    score = calculate_education_score(education, "bachelor")
    assert score == 100.0


def test_education_score_exceeds_requirement():
    education = [{"degree": "Master of Science"}]
    score = calculate_education_score(education, "bachelor")
    assert score == 100.0


def test_education_score_below_requirement():
    education = [{"degree": "High School Diploma"}]
    score = calculate_education_score(education, "master")
    assert score < 100.0


def test_education_score_no_requirement():
    score = calculate_education_score([], "")
    assert score == 100.0


def test_certifications_score_no_requirement():
    score = calculate_certifications_score(["AWS Certified"], [])
    assert score == 100.0


def test_full_match_score_excellent():
    candidate = {
        "skills": ["Python", "FastAPI", "React", "MongoDB"],
        "experience_years": 5.0,
        "education": [{"degree": "B.Tech Computer Science"}],
        "certifications": ["AWS Certified"],
    }
    job = {
        "skillsRequired": ["Python", "FastAPI", "React", "MongoDB"],
        "experienceRequired": 3.0,
        "educationRequired": "bachelor",
        "certificationsRequired": ["AWS Certified"],
    }
    result = calculate_match_score(candidate, job)
    assert result["match_score"] == 100.0
    assert result["rank"] == "Excellent Match"


def test_full_match_score_low():
    candidate = {
        "skills": ["Java"],
        "experience_years": 0.0,
        "education": [],
        "certifications": [],
    }
    job = {
        "skillsRequired": ["Python", "React", "MongoDB"],
        "experienceRequired": 5.0,
        "educationRequired": "master",
        "certificationsRequired": ["AWS Certified"],
    }
    result = calculate_match_score(candidate, job)
    assert result["match_score"] < 50.0
    assert result["rank"] == "Low Match"
