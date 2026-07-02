"""
Security Utilities — PII detection, input sanitization, and file validation.

Implements production-level security measures:
- PII detection and removal from resume text
- Input sanitization for all user inputs
- Content validation
"""

import re
import logging

logger = logging.getLogger(__name__)

# PII patterns for detection and removal
PII_PATTERNS = {
    "email": re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    ),
    "phone": re.compile(
        r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}"
    ),
    "ssn": re.compile(
        r"\b\d{3}[-]?\d{2}[-]?\d{4}\b"
    ),
    "url": re.compile(
        r"https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]*)"
    ),
    "linkedin": re.compile(
        r"(?:linkedin\.com/in/|linkedin\.com/profile/)\S+",
        re.IGNORECASE,
    ),
    "github": re.compile(
        r"(?:github\.com/)\S+",
        re.IGNORECASE,
    ),
    "address": re.compile(
        r"\d{1,5}\s\w+\s(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Road|Rd|Court|Ct|Way|Circle|Cir)\.?",
        re.IGNORECASE,
    ),
    "date_of_birth": re.compile(
        r"(?:DOB|Date\s*of\s*Birth|Born|Birthday)\s*[:\-]?\s*\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}",
        re.IGNORECASE,
    ),
    "zip_code": re.compile(
        r"\b\d{5}(?:-\d{4})?\b"
    ),
}

# Replacement tokens for redacted PII
PII_REPLACEMENTS = {
    "email": "[EMAIL_REDACTED]",
    "phone": "[PHONE_REDACTED]",
    "ssn": "[SSN_REDACTED]",
    "url": "[URL_REDACTED]",
    "linkedin": "[LINKEDIN_REDACTED]",
    "github": "[GITHUB_REDACTED]",
    "address": "[ADDRESS_REDACTED]",
    "date_of_birth": "[DOB_REDACTED]",
    "zip_code": "[ZIP_REDACTED]",
}


def remove_pii(text: str) -> str:
    """
    Remove Personally Identifiable Information from text.

    Scans for and replaces emails, phone numbers, URLs, addresses,
    SSNs, and other PII with redaction tokens.

    Args:
        text: The raw text to sanitize.

    Returns:
        Text with PII replaced by redaction tokens.
    """
    sanitized = text
    pii_found = {}

    for pii_type, pattern in PII_PATTERNS.items():
        matches = pattern.findall(sanitized)
        if matches:
            pii_found[pii_type] = len(matches)
            sanitized = pattern.sub(PII_REPLACEMENTS[pii_type], sanitized)

    if pii_found:
        logger.info(f"PII removed: {pii_found}")

    return sanitized


def sanitize_input(text: str, max_length: int = 50000) -> str:
    """
    Sanitize user input text.

    Args:
        text: Raw user input.
        max_length: Maximum allowed length.

    Returns:
        Sanitized text.

    Raises:
        ValueError: If input exceeds maximum length.
    """
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty.")

    if len(text) > max_length:
        raise ValueError(
            f"Input text exceeds maximum length of {max_length} characters."
        )

    # Remove null bytes and control characters (keep newlines and tabs)
    sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    return sanitized.strip()


def validate_role_id(role_id: str) -> str:
    """
    Validate and sanitize a role ID.

    Args:
        role_id: The role identifier to validate.

    Returns:
        Sanitized role ID.

    Raises:
        ValueError: If the role ID is invalid.
    """
    if not role_id or not role_id.strip():
        raise ValueError("Role ID cannot be empty.")

    # Role IDs should be lowercase alphanumeric with underscores
    sanitized = role_id.strip().lower()
    if not re.match(r"^[a-z][a-z0-9_]*$", sanitized):
        raise ValueError(
            f"Invalid role ID format: '{role_id}'. Use lowercase letters, numbers, and underscores."
        )

    return sanitized


def detect_pii_types(text: str) -> dict[str, int]:
    """
    Detect PII in text without removing it. Useful for generating warnings.

    Args:
        text: Text to scan for PII.

    Returns:
        Dictionary mapping PII type to count of occurrences found.
    """
    detections = {}
    for pii_type, pattern in PII_PATTERNS.items():
        matches = pattern.findall(text)
        if matches:
            detections[pii_type] = len(matches)
    return detections
