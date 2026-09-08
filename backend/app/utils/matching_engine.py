"""
Semantic ATS matching engine.

The final ATS score is calculated from sentence-transformers semantic
similarity between the candidate resume/profile and each populated job
requirement. The existing component score helpers remain available for
backward compatibility with older callers.
"""

import re
from threading import Lock
from typing import List


MODEL_NAME = "all-MiniLM-L6-v2"
_embedding_model = None
_model_lock = Lock()

# Education level ordinal mapping (kept for the legacy helper functions).
EDUCATION_LEVEL_MAP = {
    "high school": 1, "secondary": 1, "ssc": 1, "hsc": 1,
    "associate": 2, "diploma": 2,
    "bachelor": 3, "b.tech": 3, "b.sc": 3, "b.e": 3, "bsc": 3, "be": 3,
    "b.com": 3, "bca": 3, "bba": 3, "undergraduate": 3,
    "master": 4, "m.tech": 4, "m.sc": 4, "m.e": 4, "msc": 4, "mba": 4,
    "mca": 4, "m.com": 4, "postgraduate": 4,
    "phd": 5, "ph.d": 5, "doctorate": 5, "doctoral": 5,
}


def _get_embedding_model():
    """Load the embedding model once, on the first match request."""
    global _embedding_model
    if _embedding_model is None:
        with _model_lock:
            if _embedding_model is None:
                from sentence_transformers import SentenceTransformer

                _embedding_model = SentenceTransformer(MODEL_NAME)
    return _embedding_model


def _text_value(value) -> str:
    """Convert Mongo/Pydantic values into safe text for embedding."""
    if value is None:
        return ""
    if isinstance(value, dict):
        return " ".join(str(item) for item in value.values() if item not in (None, ""))
    return str(value)


def _join_text(*values) -> str:
    return " ".join(
        _text_value(value).strip()
        for value in values
        if _text_value(value).strip()
    ).strip()


def _labeled_text(label: str, value) -> str:
    value_text = _text_value(value).strip()
    return f"{label} {value_text}" if value_text else ""


def _as_list(value) -> list:
    return value if isinstance(value, list) else []


def _candidate_text(candidate: dict) -> str:
    """Build embedding text from the raw resume plus parsed profile fields."""
    education = " ".join(_text_value(entry) for entry in _as_list(candidate.get("education")))
    experience_details = " ".join(
        _text_value(entry) for entry in _as_list(candidate.get("experience_details"))
    )
    projects = " ".join(_text_value(entry) for entry in _as_list(candidate.get("projects")))
    structured = _join_text(
        f"Candidate skills: {', '.join(map(str, _as_list(candidate.get('skills'))))}",
        f"Candidate experience: {candidate.get('experience_years', 0)} years",
        f"Candidate education: {education}",
        f"Candidate experience details: {experience_details}",
        f"Candidate certifications: {', '.join(map(str, _as_list(candidate.get('certifications'))))}",
        f"Candidate projects: {projects}",
    )
    resume_text = candidate.get("resumeText") or candidate.get("resume_text") or ""
    return _join_text(resume_text, structured) or "No candidate resume information available."


def _job_requirement_blocks(job: dict) -> List[str]:
    """Return one labeled semantic input for each populated job requirement."""
    skills = ", ".join(map(str, _as_list(job.get("skillsRequired"))))
    certifications = ", ".join(map(str, _as_list(job.get("certificationsRequired"))))
    experience = job.get("experienceRequired", 0)
    blocks = [
        _labeled_text("Job title:", job.get("title", "")),
        _labeled_text("Job description:", job.get("description", "")),
        _labeled_text("Required skills:", skills),
        _labeled_text(
            "Required experience:",
            f"{experience} years" if experience else "",
        ),
        _labeled_text("Education requirements:", job.get("educationRequired", "")),
        _labeled_text("Required certifications:", certifications),
    ]
    return [block for block in blocks if block]


def _cosine_to_score(similarity: float) -> float:
    """Convert cosine similarity to the public 0-100 ATS score range."""
    return max(0.0, min(float(similarity), 1.0)) * 100.0


def _similarity_scores(model, candidate_text: str, requirement_blocks: List[str]) -> List[float]:
    embeddings = model.encode(
        [candidate_text, *requirement_blocks],
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    candidate_embedding = embeddings[0]
    return [
        _cosine_to_score(float(candidate_embedding @ requirement_embedding))
        for requirement_embedding in embeddings[1:]
    ]


def _normalized_tokens(value: str) -> List[str]:
    return re.findall(r"[a-z0-9+#]+", value.lower())


def _contains_skill(candidate_text: str, required_skill: str) -> bool:
    candidate_tokens = _normalized_tokens(candidate_text)
    required_tokens = _normalized_tokens(required_skill)
    if not required_tokens:
        return False
    width = len(required_tokens)
    return any(
        candidate_tokens[index:index + width] == required_tokens
        for index in range(len(candidate_tokens) - width + 1)
    )


def _candidate_skill_evidence(candidate: dict, candidate_text: str) -> List[str]:
    evidence = [str(skill) for skill in _as_list(candidate.get("skills")) if str(skill).strip()]
    for entry in _as_list(candidate.get("experience_details")):
        evidence.append(_text_value(entry))
    for entry in _as_list(candidate.get("projects")):
        evidence.append(_text_value(entry))
    # Keep raw resume text as semantic evidence when the parser did not extract
    # a particular skill explicitly.
    evidence.extend(part.strip() for part in re.split(r"[\n.!?]+", candidate_text) if part.strip())
    return evidence or [candidate_text]


def _match_skills(model, candidate: dict, candidate_text: str, required_skills: List[str]):
    required_skills = _as_list(required_skills)
    if not required_skills:
        return [], []

    evidence = _candidate_skill_evidence(candidate, candidate_text)
    embeddings = model.encode(
        [*evidence, *map(str, required_skills)],
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    evidence_embeddings = embeddings[:len(evidence)]
    skill_embeddings = embeddings[len(evidence):]
    matched_skills = []
    missing_skills = []

    for skill, skill_embedding in zip(required_skills, skill_embeddings):
        if _contains_skill(candidate_text, str(skill)):
            matched_skills.append(skill)
            continue

        best_similarity = max(
            float(skill_embedding @ evidence_embedding)
            for evidence_embedding in evidence_embeddings
        )
        if best_similarity >= 0.55:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    return matched_skills, missing_skills


def _match_label(score: float) -> str:
    if score >= 85:
        return "Excellent Match"
    if score >= 70:
        return "Good Match"
    if score >= 50:
        return "Moderate Match"
    return "Low Match"


def get_education_level(education_entries: list) -> int:
    """Determine the highest education level from a list of entries."""
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
    """Legacy exact-overlap helper retained for API/test compatibility."""
    if not required_skills:
        return 100.0
    candidate_lower = {s.lower().strip() for s in candidate_skills}
    required_lower = {s.lower().strip() for s in required_skills}
    matched = candidate_lower & required_lower
    return (len(matched) / len(required_lower)) * 100


def calculate_experience_score(candidate_years: float, required_years: float) -> float:
    """Legacy experience helper retained for API/test compatibility."""
    if required_years <= 0:
        return 100.0
    if candidate_years >= required_years:
        return 100.0
    return (candidate_years / required_years) * 100


def calculate_education_score(candidate_education: list, required_education_str: str) -> float:
    """Legacy education helper retained for API/test compatibility."""
    candidate_level = get_education_level(candidate_education)
    required_level = get_education_level_from_string(required_education_str)
    if required_level == 0:
        return 100.0
    if candidate_level >= required_level:
        return 100.0
    if candidate_level == 0:
        return 0.0
    return 50.0


def calculate_certifications_score(
    candidate_certs: List[str], required_certs: List[str]
) -> float:
    """Legacy certification helper retained for API/test compatibility."""
    if not required_certs:
        return 100.0
    candidate_lower = {c.lower().strip() for c in candidate_certs}
    required_lower = {c.lower().strip() for c in required_certs}
    matched = sum(1 for req in required_lower if any(req in c or c in req for c in candidate_lower))
    return (matched / len(required_lower)) * 100


def calculate_match_score(candidate: dict, job: dict) -> dict:
    """Calculate one semantic ATS score and compatibility fields."""
    model = _get_embedding_model()
    candidate_text = _candidate_text(candidate)
    requirement_blocks = _job_requirement_blocks(job)
    similarities = _similarity_scores(model, candidate_text, requirement_blocks)
    ats_score = round(sum(similarities) / len(similarities), 2) if similarities else 0.0
    match_label = _match_label(ats_score)

    required_skills = _as_list(job.get("skillsRequired"))
    matched_skills, missing_skills = _match_skills(
        model, candidate, candidate_text, required_skills
    )
    matched_count = len(matched_skills)
    required_count = len(required_skills)
    skill_summary = (
        f"{matched_count} of {required_count} required skills matched semantically."
        if required_count
        else "No specific skills were listed for this job."
    )
    missing_summary = (
        f" Missing skills: {', '.join(missing_skills)}."
        if missing_skills
        else " No required skills were identified as missing."
    )
    matching_summary = (
        f"Semantic ATS comparison scored this resume at {ats_score:.1f}/100 "
        f"({match_label}). {skill_summary}{missing_summary}"
    )

    # Preserve the previous component fields as unweighted semantic diagnostics
    # for existing API consumers. They no longer contribute to ats_score.
    component_blocks = [
        _labeled_text("Required skills:", ", ".join(map(str, _as_list(job.get("skillsRequired"))))),
        _labeled_text(
            "Required experience:",
            f"{job.get('experienceRequired', 0)} years" if job.get("experienceRequired", 0) else "",
        ),
        _labeled_text("Education requirements:", job.get("educationRequired", "")),
        _labeled_text(
            "Required certifications:",
            ", ".join(map(str, _as_list(job.get("certificationsRequired")))),
        ),
    ]
    component_scores = [
        _similarity_scores(model, candidate_text, [block])[0] if block else 100.0
        for block in component_blocks
    ]

    return {
        # New ATS response fields.
        "ats_score": ats_score,
        "match_label": match_label,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matching_summary": matching_summary,
        # Existing names retained so current clients and ranking keep working.
        "match_score": ats_score,
        "rank": match_label,
        "skill_score": round(component_scores[0], 2),
        "experience_score": round(component_scores[1], 2),
        "education_score": round(component_scores[2], 2),
        "certification_score": round(component_scores[3], 2),
    }
