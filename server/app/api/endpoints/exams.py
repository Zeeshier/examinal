
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.models import User, UserRole, Exam, ExamType, Question, Submission, QuestionType, exam_students
from app.schemas.exams import (
    ExamCreate, ExamResponse, ExamListResponse, ExamUpdate,
    QuestionCreate, QuestionResponse, QuestionBatchCreate
)
from app.services.ai_service import AIService

router = APIRouter()

# --- Schemas for Submission ---
class ExamSubmission(BaseModel):
    answers: Dict[int, str]  # {question_id: answer_text}

class SubmissionResponse(BaseModel):
    id: int
    score: float
    max_score: float
    passed: bool
    ai_feedback: Optional[str] = None


# ==========================================
# EXAM CRUD
# ==========================================

@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam_data: ExamCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INSTRUCTOR)),
    db: Session = Depends(get_db)
):
    import secrets
    access_code = secrets.token_urlsafe(6)[:8].upper()
    
    exam = Exam(
        title=exam_data.title,
        description=exam_data.description,
        creator_id=current_user.id,
        duration_minutes=exam_data.duration_minutes,
        total_marks=exam_data.total_marks,
        passing_marks=exam_data.passing_marks,
        exam_type=ExamType(exam_data.exam_type.value),
        access_code=access_code,
        start_time=exam_data.start_time,
        end_time=exam_data.end_time
    )
    
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam

@router.get("/", response_model=List[ExamListResponse])
async def list_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    published_only: bool = Query(False)
):
    query = db.query(Exam)
    
    if current_user.role == UserRole.STUDENT:
        # Students only see exams they are assigned to AND published
        query = query.join(exam_students).filter(
            exam_students.c.student_id == current_user.id,
            Exam.is_published == True
        )
    elif current_user.role == UserRole.INSTRUCTOR:
        query = query.filter(Exam.creator_id == current_user.id)
    
    if published_only and current_user.role != UserRole.STUDENT:
        query = query.filter(Exam.is_published == True)
    
    exams = query.order_by(Exam.created_at.desc()).all()
    return exams

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if current_user.role == UserRole.STUDENT and not exam.is_published:
        raise HTTPException(status_code=403, detail="Exam not available")
    
    if current_user.role == UserRole.INSTRUCTOR and exam.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return exam

@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INSTRUCTOR)),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if current_user.role != UserRole.ADMIN and exam.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = exam_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exam, field, value)
    
    db.commit()
    db.refresh(exam)
    return exam

@router.post("/{exam_id}/publish", response_model=ExamResponse)
async def publish_exam(
    exam_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INSTRUCTOR)),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if current_user.role != UserRole.ADMIN and exam.creator_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    # Must have at least one question to publish
    question_count = db.query(Question).filter(Question.exam_id == exam_id).count()
    if question_count == 0:
        raise HTTPException(status_code=400, detail="Cannot publish exam with no questions")
    
    exam.is_published = True
    db.commit()
    db.refresh(exam)
    return exam

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INSTRUCTOR)),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if current_user.role != UserRole.ADMIN and exam.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(exam)
    db.commit()
    return None


# ==========================================
# QUESTION CRUD
# ==========================================

@router.get("/{exam_id}/questions", response_model=List[QuestionResponse])
async def get_questions(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all questions for an exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    questions = db.query(Question).filter(
        Question.exam_id == exam_id
    ).order_by(Question.order).all()
    return questions

@router.post("/{exam_id}/questions", response_model=List[QuestionResponse], status_code=status.HTTP_201_CREATED)
async def add_questions(
    exam_id: int,
    batch: QuestionBatchCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INSTRUCTOR)),
    db: Session = Depends(get_db)
):
    """Add questions to an exam (batch)."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if current_user.role != UserRole.ADMIN and exam.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get current max order
    max_order = db.query(func.max(Question.order)).filter(
        Question.exam_id == exam_id
    ).scalar() or 0
    
    created = []
    for i, q_data in enumerate(batch.questions):
        # Convert options list to dict if provided
        options_dict = None
        if q_data.options:
            options_dict = {chr(65 + j): opt for j, opt in enumerate(q_data.options)}
        
        question = Question(
            exam_id=exam_id,
            question_text=q_data.question_text,
            question_type=QuestionType(q_data.question_type.value),
            options=options_dict,
            correct_answer=q_data.correct_answer,
            model_answer=q_data.model_answer,
            marks=q_data.marks,
            order=max_order + i + 1
        )
        db.add(question)
        created.append(question)
    
    db.commit()
    for q in created:
        db.refresh(q)
    
    return created

@router.delete("/{exam_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    exam_id: int,
    question_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INSTRUCTOR)),
    db: Session = Depends(get_db)
):
    """Delete a question from an exam."""
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.exam_id == exam_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if current_user.role != UserRole.ADMIN and exam.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(question)
    db.commit()
    return None


# ==========================================
# SUBMISSION & GRADING
# ==========================================

async def grade_submission_background(submission_id: int, db: Session):
    """Background task to grade subjective questions using AI."""
    try:
        submission = db.query(Submission).get(submission_id)
        if not submission:
            return

        exam = submission.exam
        questions = {q.id: q for q in exam.questions}
        current_score = submission.score or 0.0
        answers = submission.answers or {}
        detailed_feedback = {}

        for q_id_str, student_ans in answers.items():
            q_id = int(q_id_str)
            question = questions.get(q_id)
            
            if not question:
                continue
            
            if question.question_type == QuestionType.SUBJECTIVE:
                try:
                    grading = await AIService.grade_subjective_answer(
                        question_text=question.question_text,
                        model_answer=question.model_answer or "N/A",
                        student_answer=student_ans
                    )
                    ai_score_percent = grading.get("score", 0)
                    marks_awarded = (ai_score_percent / 100.0) * question.marks
                    current_score += marks_awarded
                    detailed_feedback[q_id] = grading.get("feedback", "")
                except Exception as e:
                    print(f"Error grading question {q_id}: {e}")
            
            elif question.question_type == QuestionType.OBJECTIVE:
                if student_ans == question.correct_answer:
                    current_score += question.marks
                    detailed_feedback[q_id] = "Correct"
                else:
                    detailed_feedback[q_id] = "Incorrect"

        submission.score = current_score
        submission.detailed_feedback = detailed_feedback
        submission.is_graded = True
        submission.ai_feedback = "AI Grading Complete."
        db.commit()
        
    except Exception as e:
        print(f"Error in background grading: {e}")


@router.post("/{exam_id}/submit", response_model=SubmissionResponse)
async def submit_exam(
    exam_id: int,
    submission_data: ExamSubmission,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    """Submit an exam. Grades objective immediately, queues subjective for AI."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    existing = db.query(Submission).filter(
        Submission.exam_id == exam_id,
        Submission.student_id == current_user.id
    ).first()
    
    if existing:
         raise HTTPException(status_code=400, detail="You have already submitted this exam.")

    initial_score = 0.0
    questions = {q.id: q for q in exam.questions}
    
    for q_id, ans in submission_data.answers.items():
        question = questions.get(q_id)
        if question and question.question_type == QuestionType.OBJECTIVE:
            if ans == question.correct_answer:
                initial_score += question.marks

    submission = Submission(
        exam_id=exam_id,
        student_id=current_user.id,
        answers=submission_data.answers,
        score=initial_score,
        max_score=exam.total_marks,
        is_graded=False 
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)

    background_tasks.add_task(grade_submission_background, submission.id, db)

    return {
        "id": submission.id,
        "score": submission.score,
        "max_score": submission.max_score,
        "passed": False,
        "ai_feedback": "Grading in progress..."
    }


# ==========================================
# ANALYTICS
# ==========================================

class StatsResponse(BaseModel):
    average_score: float
    total_exams_taken: int
    recent_performance: List[Dict[str, Any]]
    weak_areas: List[str]

@router.get("/results/stats", response_model=StatsResponse)
async def get_student_stats(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    submissions = db.query(Submission).filter(Submission.student_id == current_user.id).all()
    
    if not submissions:
        return {
            "average_score": 0,
            "total_exams_taken": 0,
            "recent_performance": [],
            "weak_areas": []
        }

    total_score_percent = 0
    graded_count = 0
    recent = []

    for sub in submissions:
        if sub.max_score and sub.max_score > 0 and sub.score is not None:
             percent = (sub.score / sub.max_score) * 100
             total_score_percent += percent
             graded_count += 1
             recent.append({
                 "exam_title": sub.exam.title,
                 "score_percent": percent,
                 "date": sub.submitted_at.strftime("%Y-%m-%d") if sub.submitted_at else ""
             })
    
    avg = total_score_percent / graded_count if graded_count > 0 else 0
    
    return {
        "average_score": round(avg, 1),
        "total_exams_taken": len(submissions),
        "recent_performance": recent[:5],
        "weak_areas": []
    }
