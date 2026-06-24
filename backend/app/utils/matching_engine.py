"""
AI Matching Engine
Calculates a weighted match score between a candidate profile and a job posting.

Formula:
  Match Score = (Skills Score × 0.50) + (Experience Score × 0.25)
              + (Education Score × 0.15) + (Certifications Score × 0.10)
"""

from typing import List, Optional

# Education level ordinal mapping
EDUCATION_LEVEL_MAP = {
    "high school": 1, "secondary": 1, "ssc": 1, "hsc": 1,
    "associate": 2, "diploma": 2,
    "bachelor": 3, "b.tech": 3, "b.sc": 3, "b.e": 3, "bsc": 3, "be": 3,
    "b.com": 3, "bca": 3, "bba": 3, "undergraduate": 3,
    "master": 4, "m.tech": 4, "m.sc": 4, "m.e": 4, "msc": 4, "mba": 4,
    "mca": 4, "m.com": 4, "postgraduate": 4,
    "phd": 5, "ph.d": 5, "doctorate": 5, "doctoral": 5,
}


def get_education_level(education_entries: list) -> int:
    """
    Determine the highest education level ordinal from a list of education entries.
    Each entry is a dict with a 'degree' field.
    """
    highest = 0
    for entry in education_entries:
        degree_text = entry.get("degree", "").lower() if isinstance(entry, dict) else str(entry).lower()
        for keyword, level in EDUCATION_LEVEL_MAP.items():
            if keyword in degree_text:
                highest = max(highest, level)
    return highest


def get_education_level_from_string(degree_str: str) -> int:
    """Parse a degree string into an ordinal level."""
    if not degree_str:
        return 0
    degree_lower = degree_str.lower()
    for keyword, level in EDUCATION_LEVEL_MAP.items():
        if keyword in degree_lower:
            return level
    return 0


def calculate_skills_score(candidate_skills: List[str], required_skills: List[str]) -> float:
    """
    Skills Match Score (50% weight)
    Score = |candidate_skills ∩ required_skills| / |required_skills| × 100
    """
    if not required_skills:
        return 100.0

    candidate_lower = {s.lower().strip() for s in candidate_skills}
    required_lower = {s.lower().strip() for s in required_skills}
    matched = candidate_lower & required_lower
    return (len(matched) / len(required_lower)) * 100


def calculate_experience_score(candidate_years: float, required_years: float) -> float:
    """
    Experience Match Score (25% weight)
    If candidate meets or exceeds requirement → 100
    Otherwise → (candidate_years / required_years) × 100
    """
    if required_years <= 0:
        return 100.0
    if candidate_years >= required_years:
        return 100.0
    return (candidate_years / required_years) * 100


def calculate_education_score(candidate_education: list, required_education_str: str) -> float:
    """
    Education Match Score (15% weight)
    Candidate level >= required level → 100
    Candidate level < required level → 50 (partial)
    """
    candidate_level = get_education_level(candidate_education)
    required_level = get_education_level_from_string(required_education_str)

    if required_level == 0:
        return 100.0  # No requirement specified
    if candidate_level >= required_level:
        return 100.0
    if candidate_level == 0:
        return 0.0
    return 50.0  # Has some education but below requirement


def calculate_certifications_score(
    candidate_certs: List[str], required_certs: List[str]
) -> float:
    """
    Certifications Match Score (10% weight)
    Ratio of matching certifications to required certifications.
    If no certs required → 100%.
    """
    if not required_certs:
        return 100.0

    candidate_lower = {c.lower().strip() for c in candidate_certs}
    required_lower = {c.lower().strip() for c in required_certs}
    matched = sum(1 for req in required_lower if any(req in c or c in req for c in candidate_lower))
    return (matched / len(required_lower)) * 100


def calculate_match_score(candidate: dict, job: dict) -> dict:
    """
    Main matching function. Calculates a weighted match score and returns results.

    Args:
        candidate: dict with keys: skills, experience_years, education, certifications
        job: dict with keys: skillsRequired, experienceRequired, educationRequired, certificationsRequired

    Returns:
        dict with keys: match_score, rank, skill_score, experience_score,
                        education_score, certification_score, matched_skills
    """
    candidate_skills = candidate.get("skills", [])
    required_skills = job.get("skillsRequired", [])

    skill_score = calculate_skills_score(candidate_skills, required_skills)
    experience_score = calculate_experience_score(
        candidate.get("experience_years", 0),
        job.get("experienceRequired", 0),
    )
    education_score = calculate_education_score(
        candidate.get("education", []),
        job.get("educationRequired", ""),
    )
    cert_score = calculate_certifications_score(
        candidate.get("certifications", []),
        job.get("certificationsRequired", []),
    )

    # Weighted formula
    match_score = (
        skill_score * 0.50
        + experience_score * 0.25
        + education_score * 0.15
        + cert_score * 0.10
    )
    match_score = round(min(match_score, 100.0), 2)

    # Determine rank category
    if match_score >= 85:
        rank = "Excellent Match"
    elif match_score >= 70:
        rank = "Good Match"
    elif match_score >= 50:
        rank = "Moderate Match"
    else:
        rank = "Low Match"

    # Find matched skills for display
    candidate_lower = {s.lower().strip() for s in candidate_skills}
    required_lower = {s.lower().strip() for s in required_skills}
    matched_skills = list(candidate_lower & required_lower)

    return {
        "match_score": match_score,
        "rank": rank,
        "skill_score": round(skill_score, 2),
        "experience_score": round(experience_score, 2),
        "education_score": round(education_score, 2),
        "certification_score": round(cert_score, 2),
        "matched_skills": matched_skills,
    }
