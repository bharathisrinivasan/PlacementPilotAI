"""Tests for the optional RAG retrieval layer (no external API calls required)."""

from backend.rag.retriever import (
    _build_documents,
    _cosine_similarity,
    retrieve_career_context,
)


def test_build_documents_uses_existing_role_knowledge():
    documents = _build_documents("software_engineer")

    assert documents
    assert any("Data Structures" in item["content"] for item in documents)
    assert any("LeetCode" in item["content"] for item in documents)
    assert all(item["doc_id"] and item["content"] for item in documents)


def test_build_documents_returns_empty_for_unknown_role():
    assert _build_documents("not_a_real_role") == []


def test_cosine_similarity():
    assert _cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert _cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0
    assert _cosine_similarity([1.0], [1.0, 2.0]) == 0.0


def test_retrieval_can_be_disabled(monkeypatch):
    monkeypatch.setenv("RAG_ENABLED", "false")
    assert retrieve_career_context("software_engineer", "Java and SQL") == ""
