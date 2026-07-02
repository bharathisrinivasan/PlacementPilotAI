"""
PDF Parser Utility — Extracts text from uploaded PDF resumes.

Handles:
- PDF text extraction using PyPDF2
- In-memory processing (no temp files)
- Validation for file type, size, and content
- Corrupted and empty PDF detection
"""

import io
import logging
from typing import Optional

from PyPDF2 import PdfReader
from PyPDF2.errors import PdfReadError

logger = logging.getLogger(__name__)

# Maximum file size: 10MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"application/pdf"}


class PDFParseError(Exception):
    """Custom exception for PDF parsing errors."""

    def __init__(self, message: str, error_code: str = "PDF_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


def validate_pdf_upload(
    file_content: bytes,
    content_type: Optional[str] = None,
    filename: Optional[str] = None,
) -> None:
    """
    Validate the uploaded PDF file.

    Args:
        file_content: Raw bytes of the uploaded file.
        content_type: MIME type of the uploaded file.
        filename: Original filename of the upload.

    Raises:
        PDFParseError: If validation fails.
    """
    # Check file size
    if len(file_content) > MAX_FILE_SIZE_BYTES:
        size_mb = len(file_content) / (1024 * 1024)
        raise PDFParseError(
            f"File size ({size_mb:.1f}MB) exceeds maximum allowed size (10MB).",
            error_code="FILE_TOO_LARGE",
        )

    if len(file_content) == 0:
        raise PDFParseError(
            "The uploaded file is empty.",
            error_code="EMPTY_FILE",
        )

    # Check content type
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise PDFParseError(
            f"Invalid file type: {content_type}. Only PDF files are accepted.",
            error_code="INVALID_TYPE",
        )

    # Check file extension
    if filename and not filename.lower().endswith(".pdf"):
        raise PDFParseError(
            f"Invalid file extension. Only .pdf files are accepted.",
            error_code="INVALID_EXTENSION",
        )

    # Check PDF magic bytes
    if file_content[:5] != b"%PDF-":
        raise PDFParseError(
            "The file does not appear to be a valid PDF document.",
            error_code="INVALID_PDF",
        )


def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text from a PDF file processed entirely in memory.

    Args:
        file_content: Raw bytes of the PDF file.

    Returns:
        Extracted text from all pages of the PDF.

    Raises:
        PDFParseError: If the PDF cannot be read or is empty.
    """
    try:
        # Process in memory — no temp files created
        pdf_stream = io.BytesIO(file_content)
        reader = PdfReader(pdf_stream)

        if len(reader.pages) == 0:
            raise PDFParseError(
                "The PDF contains no pages.",
                error_code="EMPTY_PDF",
            )

        # Extract text from all pages
        text_parts = []
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())
            except Exception as e:
                logger.warning(f"Failed to extract text from page {page_num + 1}: {e}")
                continue

        full_text = "\n\n".join(text_parts)

        if not full_text.strip():
            raise PDFParseError(
                "Could not extract any text from the PDF. The file may be scanned/image-based.",
                error_code="NO_TEXT",
            )

        # Clean up the stream
        pdf_stream.close()

        logger.info(f"Successfully extracted {len(full_text)} characters from {len(reader.pages)} pages")
        return full_text

    except PdfReadError as e:
        raise PDFParseError(
            f"The PDF file is corrupted or encrypted: {str(e)}",
            error_code="CORRUPTED_PDF",
        )
    except PDFParseError:
        raise
    except Exception as e:
        raise PDFParseError(
            f"Unexpected error while parsing PDF: {str(e)}",
            error_code="PARSE_ERROR",
        )


def parse_resume_pdf(
    file_content: bytes,
    content_type: Optional[str] = None,
    filename: Optional[str] = None,
) -> str:
    """
    Full pipeline: validate and extract text from a resume PDF.

    Args:
        file_content: Raw bytes of the uploaded PDF.
        content_type: MIME type of the upload.
        filename: Original filename.

    Returns:
        Extracted resume text.

    Raises:
        PDFParseError: If validation or extraction fails.
    """
    validate_pdf_upload(file_content, content_type, filename)
    return extract_text_from_pdf(file_content)
