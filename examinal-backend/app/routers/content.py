"""
Content upload, ingestion, and passage retrieval.
All endpoints enforce course ownership — only the owning instructor or an admin
can upload, ingest, list, or delete documents.
"""

import uuid
from typing import List
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import InstructorUser
from app.models.content import ContentDocument, ContentPassage
from app.models.course import Course
from app.schemas.content import DocumentOut, PassageOut, IngestionStatus
from app.services.content_ingestion import ContentIngestionService
from app.services.vector_store import VectorStoreService

router = APIRouter(prefix="/api/content", tags=["Content Ingestion"])

ALLOWED_TYPES = {"pdf", "docx", "pptx"}


# ── Helper: verify course ownership ───────────────────────────────────────────
def _require_course_owner(course_id: int, user: InstructorUser, db: Session) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role == "instructor" and course.instructor_id != user.id:
        raise HTTPException(status_code=403, detail="Not your course")
    return course


# ── Upload ─────────────────────────────────────────────────────────────────────
@router.post("/upload/{course_id}", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    course_id: int,
    user: InstructorUser,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
):
    _require_course_owner(course_id, user, db)

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed. Use: {ALLOWED_TYPES}")

    content_bytes = await file.read()
    if len(content_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.MAX_UPLOAD_SIZE_MB} MB)")

    # Ensure upload directory exists (safety net — also created at startup)
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = upload_dir / filename
    save_path.write_bytes(content_bytes)

    doc = ContentDocument(
        course_id=course_id,
        filename=filename,
        original_filename=file.filename or "unknown",
        file_type=ext,
        file_size=len(content_bytes),
        uploaded_by=user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ── Ingest ─────────────────────────────────────────────────────────────────────
@router.post("/ingest/{document_id}", response_model=IngestionStatus)
def ingest_document(
    document_id: int,
    user: InstructorUser,   # properly injected
    db: Session = Depends(get_db),
):
    doc = db.query(ContentDocument).filter(ContentDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    _require_course_owner(doc.course_id, user, db)

    doc.upload_status = "processing"
    db.commit()

    try:
        ingestion_svc = ContentIngestionService()
        file_path = Path(settings.UPLOAD_DIR) / doc.filename
        if not file_path.exists():
            raise FileNotFoundError(f"Uploaded file not found: {doc.filename}")

        passages_data = ingestion_svc.parse_and_chunk(str(file_path), doc.file_type)

        if not passages_data:
            doc.upload_status = "indexed"
            db.commit()
            return IngestionStatus(
                document_id=doc.id,
                status="indexed",
                passages_created=0,
                message="No content found to index",
            )

        vs_service = VectorStoreService()
        
        # Prepare batches
        texts = [p["text"] for p in passages_data]
        embeddings = vs_service._embed_documents(texts)
        
        passage_records: list[ContentPassage] = []
        passage_ids = []

        for idx, (pdata, emb) in enumerate(zip(passages_data, embeddings)):
            passage = ContentPassage(
                document_id=doc.id,
                content=pdata["text"],
                page_number=pdata.get("page"),
                chunk_index=idx,
            )
            db.add(passage)
            db.flush()  # Get passage.id
            
            passage.embedding_id = str(passage.id)
            passage_ids.append(str(passage.id))
            passage_records.append(passage)

        # Batch add to vector store
        vs_service.add_passages_batch(
            collection_name=f"course_{doc.course_id}",
            passage_ids=passage_ids,
            texts=texts,
            metadatas=[{
                "document_id": doc.id,
                "course_id": doc.course_id,
                "page": passages_data[i].get("page"),
                "chunk_index": i,
            } for i in range(len(passages_data))]
        )

        doc.upload_status = "indexed"
        db.commit()

        return IngestionStatus(
            document_id=doc.id,
            status="indexed",
            passages_created=len(passage_records),
            message="Content ingested and indexed successfully",
        )
    except Exception as e:
        doc.upload_status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


# ── List documents ─────────────────────────────────────────────────────────────
@router.get("/documents/{course_id}", response_model=List[DocumentOut])
def list_documents(
    course_id: int,
    user: InstructorUser,   # properly injected
    db: Session = Depends(get_db),
):
    _require_course_owner(course_id, user, db)
    return db.query(ContentDocument).filter(ContentDocument.course_id == course_id).all()


# ── List passages ──────────────────────────────────────────────────────────────
@router.get("/passages/{document_id}", response_model=List[PassageOut])
def list_passages(
    document_id: int,
    user: InstructorUser,   # properly injected
    db: Session = Depends(get_db),
):
    doc = db.query(ContentDocument).filter(ContentDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _require_course_owner(doc.course_id, user, db)
    return db.query(ContentPassage).filter(ContentPassage.document_id == document_id).all()


# ── Delete document ────────────────────────────────────────────────────────────
@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    user: InstructorUser,   # properly injected
    db: Session = Depends(get_db),
):
    doc = db.query(ContentDocument).filter(ContentDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    _require_course_owner(doc.course_id, user, db)

    # Remove from vector store
    try:
        vs_service = VectorStoreService()
        passage_ids = [str(p.id) for p in doc.passages]
        if passage_ids:
            vs_service.delete_passages(f"course_{doc.course_id}", passage_ids)
    except Exception:
        pass  # best-effort; proceed with DB/file deletion

    # Remove physical file
    file_path = Path(settings.UPLOAD_DIR) / doc.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(doc)
    db.commit()
