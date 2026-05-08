from datetime import datetime
from typing import Optional, List, Dict, Union

from pydantic import BaseModel


class AnswerSubmit(BaseModel):
    question_id: int
    student_answer: str


class AutosaveRequest(BaseModel):
    answers: List[AnswerSubmit]


class SubmissionStart(BaseModel):
    exam_id: int
    access_key: str


class SubmissionOut(BaseModel):
    id: int
    exam_id: int
    student_id: int
    started_at: datetime
    submitted_at: Optional[datetime]
    status: str
    total_score: Optional[float]
    max_score: Optional[float]
    percentage: Optional[float]
    is_passed: Optional[bool]
    results_published: bool
    graded_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AnswerResponseOut(BaseModel):
    id: int
    submission_id: int
    question_id: int
    student_answer: Optional[str]
    is_correct: Optional[bool]
    score: float
    max_score: float
    ai_feedback: Optional[str]
    confidence_score: Optional[float]

    model_config = {"from_attributes": True}


class SubmissionDetail(BaseModel):
    submission: SubmissionOut
    answers: List[AnswerResponseOut]


class ActivityEvent(BaseModel):
    exam_id: int
    submission_id: int
    action_type: str
    # Accept a plain string OR a JSON object OR nothing.
    # The frontend sends plain strings like "Violation #1: ..."
    # which caused a 422 when this was typed as Dict only.
    details: Optional[Union[str, Dict]] = None


class ScoreOverrideOut(BaseModel):
    id: int
    answer_id: int
    submission_id: int
    reviewer_id: int
    old_score: float
    new_score: float
    old_feedback: Optional[str]
    new_feedback: Optional[str]
    old_confidence: Optional[float]
    reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
