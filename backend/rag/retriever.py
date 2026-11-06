"""
Embedding-based RAG retrieval over PlacementPilot's existing career knowledge.

The index stores only curated role data from career_data.py. Candidate resume text
is used transiently to form a retrieval query; it is never persisted in the index.
If embeddings or the index are unavailable, callers receive an empty context and
the original Career Coach workflow continues unchanged.
"""

from __future__ import annotations

import json
import logging
import math
import os
import sqlite3
import threading
from pathlib import Path
from typing import Any

from backend.mcp_server.career_data import CAREER_ROLES

logger = logging.getLogger(__name__)
_INDEX_LOCK = threading.Lock()

DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"
DEFAULT_DB_PATH = "/tmp/placementpilot_rag.sqlite3"


def _rag_enabled() -> bool:
    """RAG is enabled by default, but can be disabled without code changes."""
    return os.getenv("RAG_ENABLED", "true").strip().lower() in {"1", "true", "yes", "on"}


def _database_path() -> str:
    return os.getenv("RAG_DB_PATH", DEFAULT_DB_PATH)


def _build_documents(role_id: str) -> list[dict[str, str]]:
    """Convert structured role knowledge into small, independently retrievable chunks."""
    role = CAREER_ROLES.get(role_id)
    if not role:
        return []

    title = role.get("metadata", {}).get("title", role_id)
    documents: list[dict[str, str]] = []

    def add(category: str, text: str) -> None:
        cleaned = text.strip()
        if cleaned:
            documents.append({
                "doc_id": f"{category}_{len(documents)}",
                "content": f"Career role: {title}\nKnowledge category: {category}\n{cleaned}",
            })

    add(
        "role_overview",
        f"Description: {role.get('metadata', {}).get('description', '')}. "
        f"Difficulty: {role.get('difficulty', 'Not specified')}. "
        f"Typical preparation duration: {role.get('average_preparation_weeks', 'Not specified')} weeks.",
    )

    for skill in role.get("must_have_skills", []):
        add("must_have_skill", f"Required skill: {skill}. This is a must-have skill for the {title} role.")

    for skill in role.get("good_to_have_skills", []):
        add("good_to_have_skill", f"Additional skill: {skill}. This is beneficial for the {title} role.")

    for topic in role.get("interview_topics", []):
        add("interview_topic", f"Interview preparation topic: {topic}.")

    for project in role.get("project_recommendations", []):
        add(
            "project",
            "Project: {title}. Description: {description}. Skills demonstrated: {skills}. "
            "Difficulty: {difficulty}. Estimated hours: {hours}.".format(
                title=project.get("title", "Untitled project"),
                description=project.get("description", ""),
                skills=", ".join(project.get("skills_demonstrated", [])),
                difficulty=project.get("difficulty", "Not specified"),
                hours=project.get("estimated_hours", "Not specified"),
            ),
        )

    for resource in role.get("learning_resources", []):
        add(
            "learning_resource",
            "Resource: {name}. Type: {kind}. URL: {url}. Free: {free}.".format(
                name=resource.get("name", "Unnamed resource"),
                kind=resource.get("type", "Resource"),
                url=resource.get("url", ""),
                free=resource.get("free", "Unknown"),
            ),
        )

    for certification in role.get("certifications", []):
        add(
            "certification",
            "Certification: {name}. Provider: {provider}. Difficulty: {difficulty}.".format(
                name=certification.get("name", ""),
                provider=certification.get("provider", ""),
                difficulty=certification.get("difficulty", "Not specified"),
            ),
        )

    return documents


def _get_embedding_client() -> Any:
    """Create the Google GenAI client lazily so importing the app needs no RAG setup."""
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_google_api_key_here":
        raise RuntimeError("Google API key is not configured for RAG embeddings.")

    from google import genai

    return genai.Client(api_key=api_key)


def _embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings in small batches using the already-configured Google API."""
    if not texts:
        return []

    client = _get_embedding_client()
    model = os.getenv("RAG_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)
    vectors: list[list[float]] = []

    for start in range(0, len(texts), 32):
        batch = texts[start:start + 32]
        response = client.models.embed_content(model=model, contents=batch)
        batch_embeddings = getattr(response, "embeddings", None) or []
        if len(batch_embeddings) != len(batch):
            raise RuntimeError("Embedding service returned an unexpected number of vectors.")
        for embedding in batch_embeddings:
            values = getattr(embedding, "values", None)
            if not values:
                raise RuntimeError("Embedding service returned an empty vector.")
            vectors.append([float(value) for value in values])

    return vectors


def _ensure_schema(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS rag_documents (
            role_id TEXT NOT NULL,
            doc_id TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding TEXT NOT NULL,
            PRIMARY KEY (role_id, doc_id)
        )
        """
    )
    connection.commit()


def _ensure_role_index(role_id: str, documents: list[dict[str, str]]) -> None:
    """Build a role index once; use a lock to avoid duplicate first-request indexing."""
    db_path = _database_path()
    Path(db_path).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)

    with _INDEX_LOCK:
        with sqlite3.connect(db_path) as connection:
            _ensure_schema(connection)
            row = connection.execute(
                "SELECT COUNT(*) FROM rag_documents WHERE role_id = ?",
                (role_id,),
            ).fetchone()
            indexed_count = int(row[0]) if row else 0
            if indexed_count == len(documents) and indexed_count > 0:
                return

            # Replace only this role's index, never another role's documents.
            connection.execute("DELETE FROM rag_documents WHERE role_id = ?", (role_id,))
            vectors = _embed_texts([item["content"] for item in documents])
            connection.executemany(
                """
                INSERT INTO rag_documents (role_id, doc_id, content, embedding)
                VALUES (?, ?, ?, ?)
                """,
                [
                    (role_id, item["doc_id"], item["content"], json.dumps(vector))
                    for item, vector in zip(documents, vectors)
                ],
            )
            connection.commit()
            logger.info("Indexed %s RAG knowledge chunks for role %s", len(documents), role_id)


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    """Calculate cosine similarity without requiring a separate vector database."""
    if not left or len(left) != len(right):
        return 0.0
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if not left_norm or not right_norm:
        return 0.0
    return dot / (left_norm * right_norm)


def retrieve_career_context(
    role_id: str,
    resume_text: str = "",
    job_description: str = "",
    top_k: int = 7,
) -> str:
    """
    Retrieve role-specific knowledge for the Career Coach Agent.

    Returns an empty string on any retrieval failure so the existing agent pipeline
    can proceed with its original prompt and behavior.
    """
    if not _rag_enabled():
        logger.info("RAG retrieval is disabled by RAG_ENABLED.")
        return ""

    documents = _build_documents(role_id)
    if not documents:
        logger.warning("No RAG source documents found for role: %s", role_id)
        return ""

    try:
        _ensure_role_index(role_id, documents)

        role_title = CAREER_ROLES[role_id].get("metadata", {}).get("title", role_id)
        query = (
            f"Find the most useful learning resources, interview topics, projects, "
            f"and certifications for a student preparing for {role_title}. "
            f"Candidate resume context: {resume_text[:1800]}. "
            f"Target job description: {job_description[:900]}. "
            f"Prioritize knowledge that helps address likely skill gaps and prepare for interviews."
        )
        query_vector = _embed_texts([query])[0]

        with sqlite3.connect(_database_path()) as connection:
            _ensure_schema(connection)
            rows = connection.execute(
                "SELECT content, embedding FROM rag_documents WHERE role_id = ?",
                (role_id,),
            ).fetchall()

        ranked: list[tuple[float, str]] = []
        for content, raw_embedding in rows:
            score = _cosine_similarity(query_vector, json.loads(raw_embedding))
            ranked.append((score, content))

        ranked.sort(key=lambda item: item[0], reverse=True)
        selected = [content for score, content in ranked[:max(1, top_k)] if score > 0]

        if not selected:
            logger.info("RAG retrieval returned no relevant chunks for role %s.", role_id)
            return ""

        return "\n\n".join(
            f"[Retrieved knowledge {index}]\n{content}"
            for index, content in enumerate(selected, start=1)
        )
    except Exception as exc:
        logger.warning(
            "RAG retrieval failed; continuing with the original Career Coach prompt: %s",
            exc,
            exc_info=True,
        )
        return ""
