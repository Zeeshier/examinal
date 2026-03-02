from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.models import User, UserRole, Exam
from app.models.documents import Document
from app.services.ai_service import AIService

router = APIRouter()

class GenerateQuestionsRequest(BaseModel):
    exam_id: int
    num_questions: int = 5
    difficulty: str = "medium"
    question_type: str = "mixed"  # "objective", "subjective", "mixed"

class GradeRequest(BaseModel):
    question_text: str
    model_answer: str
    student_answer: str

@router.post("/generate", response_model=List[dict])
async def generate_exam_questions(
    request: GenerateQuestionsRequest,
    current_user: User = Depends(require_role(UserRole.INSTRUCTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Generate questions using RAG + NVIDIA AI for a specific exam.
    Processes documents synchronously if FAISS index not ready.
    """
    # Verify exam ownership
    exam = db.query(Exam).filter(Exam.id == request.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if current_user.role != UserRole.ADMIN and exam.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if documents exist for this exam
    docs = db.query(Document).filter(
        Document.exam_id == request.exam_id,
        Document.extracted_text.isnot(None)
    ).all()
    
    if not docs:
        raise HTTPException(status_code=400, detail="No documents uploaded. Please upload a document first.")

    # Ensure document is processed into FAISS (synchronous - fixes race condition)
    for doc in docs:
        if doc.extracted_text:
            try:
                await AIService.process_and_store_document(
                    text=doc.extracted_text,
                    exam_id=request.exam_id
                )
            except Exception as e:
                print(f"Warning: FAISS processing error: {e}")

    try:
        questions = await AIService.generate_questions(
            exam_id=request.exam_id,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            question_type=request.question_type
        )
        return questions
    except Exception as e:
        print(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@router.post("/grade")
async def grade_answer(
    request: GradeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    AI Grading for subjective answers.
    """
    try:
        result = await AIService.grade_subjective_answer(
            question_text=request.question_text,
            model_answer=request.model_answer,
            student_answer=request.student_answer
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
