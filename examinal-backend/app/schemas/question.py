from datetime import datetime
from typing import Optional, Dict, List

from pydantic import BaseModel, Field, model_validator


# ── MCQ validation helper ──────────────────────────────────────────────────────
_VALID_MCQ_KEYS = {"A", "B", "C", "D"}


def _validate_mcq_fields(question_type: str, options: Optional[Dict], correct_answer: Optional[str]):
    """Shared MCQ validation used in both Create and Update schemas."""
    if question_type == "mcq":
        if not options:
            raise ValueError("MCQ questions must include an 'options' dict with keys A, B, C, D.")
        if set(options.keys()) != _VALID_MCQ_KEYS:
            raise ValueError(f"MCQ options must have exactly the keys A, B, C, D. Got: {sorted(options.keys())}")
        for key, val in options.items():
            if not isinstance(val, str) or not val.strip():
                raise ValueError(f"MCQ option '{key}' must be a non-empty string.")
        if correct_answer and correct_answer.upper() not in _VALID_MCQ_KEYS:
            raise ValueError(f"MCQ correct_answer must be one of A, B, C, D. Got: '{correct_answer}'")


class QuestionCreate(BaseModel):
    exam_id: int
    question_text: str = Field(min_length=5)
    question_type: str = Field(pattern="^(mcq|short_answer|descriptive)$")
    options: Optional[Dict[str, str]] = None  # {"A":"...","B":"...","C":"...","D":"..."}
    correct_answer: str = Field(min_length=1)
    marks: float = Field(default=1.0, gt=0, le=100)
    explanation: Optional[str] = None
    rubric: Optional[str] = None
    topic: Optional[str] = None
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    order_index: int = 0

    @model_validator(mode="after")
    def validate_mcq(self):
        _validate_mcq_fields(self.question_type, self.options, self.correct_answer)
        return self


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[str] = None
    marks: Optional[float] = Field(default=None, gt=0, le=100)
    explanation: Optional[str] = None
    rubric: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = Field(default=None, pattern="^(easy|medium|hard)$")
    order_index: Optional[int] = None

    @model_validator(mode="after")
    def validate_mcq_update(self):
        # Only validate MCQ fields if options are being updated
        if self.options is not None:
            _validate_mcq_fields("mcq", self.options, self.correct_answer)
        return self


class QuestionOut(BaseModel):
    id: int
    exam_id: int
    question_text: str
    question_type: str
    options: Optional[Dict[str, str]]
    correct_answer: str
    marks: float
    explanation: Optional[str]
    rubric: Optional[str]
    topic: Optional[str] = None
    difficulty: str
    order_index: int
    source_passage_id: Optional[int] = None   # AI audit trail
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionStudentView(BaseModel):
    """Same as QuestionOut but hides correct_answer, explanation, and source."""
    id: int
    exam_id: int
    question_text: str
    question_type: str
    options: Optional[Dict[str, str]]
    marks: float
    difficulty: str
    order_index: int

    model_config = {"from_attributes": True}


class GenerateQuestionsRequest(BaseModel):
    course_id: int
    exam_id: int
    num_questions: int = Field(default=5, ge=1, le=50)
    question_type: str = Field(default="mcq", pattern="^(mcq|short_answer|descriptive|mixed)$")
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard|mixed)$")
    topic: Optional[str] = None
    marks: Optional[float] = Field(default=None, gt=0, le=100)
