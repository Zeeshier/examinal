"""
Upload Endpoint
Handles PDF/DOCX file uploads with text extraction.
"""

import os
import tempfile
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.models import User, UserRole, Exam
from app.models.documents import Document
from app.services.ai_service import AIService

router = APIRouter()


def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    """
    Extract text from a PDF file using pdfplumber.
    
    Returns:
        Tuple of (extracted_text, page_count)
    """
    import pdfplumber
    
    text_content = []
    page_count = 0
    
    with pdfplumber.open(file_path) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
    
    return "\n\n".join(text_content), page_count


def extract_text_from_docx(file_path: str) -> tuple[str, int]:
    """
    Extract text from a DOCX file using python-docx.
    
    Returns:
        Tuple of (extracted_text, paragraph_count)
    """
    from docx import Document as DocxDocument
    
    doc = DocxDocument(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    
    return "\n\n".join(paragraphs), len(paragraphs)


@router.post("/upload/{exam_id}")
async def upload_document(
    exam_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INSTRUCTOR)),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF or DOCX file and extract its text content.
    The content is also processed into vector embeddings for RAG.
    """
    # Verify exam exists and belongs to user
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    # Check ownership (unless admin)
    if current_user.role != UserRole.ADMIN and exam.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload documents for this exam"
        )
    
    # Validate file type
    allowed_types = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
    }
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: PDF, DOCX. Got: {file.content_type}"
        )
    
    file_type = allowed_types[file.content_type]
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Save to temp file for processing
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_type}") as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Extract text based on file type
        if file_type == "pdf":
            extracted_text, page_count = extract_text_from_pdf(tmp_path)
        else:
            extracted_text, page_count = extract_text_from_docx(tmp_path)
        
        # Create document record
        document = Document(
            exam_id=exam_id,
            filename=file.filename,
            file_type=file_type,
            file_size=file_size,
            extracted_text=extracted_text,
            page_count=page_count,
            is_processed=True
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)

        # Trigger Vector Embedding (Async Background Task)
        if extracted_text:
             background_tasks.add_task(
                 AIService.process_and_store_document, 
                 text=extracted_text, 
                 exam_id=exam_id
             )
        
        return {
            "success": True,
            "message": "Document uploaded. AI processing started in background.",
            "document": {
                "id": document.id,
                "filename": document.filename,
                "file_type": document.file_type,
                "file_size": document.file_size,
                "page_count": document.page_count
            }
        }
        
    except Exception as e:
        # Log error and save failed document
        document = Document(
            exam_id=exam_id,
            filename=file.filename,
            file_type=file_type,
            file_size=file_size,
            is_processed=False,
            processing_error=str(e)
        )
        db.add(document)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )
    
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
