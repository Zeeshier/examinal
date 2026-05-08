"""
RAG + LLM question generation with robust JSON parsing.

Improvements over original:
  - No-content raises ValueError (→ 400) not a generic 500
  - Enforces total_marks limit before persisting
  - Stores source_passage_id from the top retrieved passage for AI auditability
  - MCQ questions that don't parse to 4 valid options are silently skipped
"""

import json
import logging
import re
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.question import ExamQuestion
from app.models.exam import Exam
from app.services.rag_pipeline import RAGPipeline

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert exam question generator for academic assessments.

STRICT RULES:
1. Use ONLY the provided course context.
2. Every question must be answerable from the context.
3. Return ONLY a valid JSON array — no markdown fences, no extra text.
4. Keep model answers CONCISE — max 3 sentences for short answer, max 5 sentences for descriptive.
5. Each question must have ONE clear correct answer."""

MCQ_PROMPT = """Generate exactly {num} MCQ questions from the context.
Difficulty: {difficulty}
{topic_line}

Each question: 4 options (A,B,C,D), one correct answer, brief explanation.

Return JSON array:
[{{"question_text":"...","options":{{"A":"...","B":"...","C":"...","D":"..."}},"correct_answer":"A","explanation":"...","difficulty":"{difficulty}"}}]"""

SHORT_ANSWER_PROMPT = """Generate exactly {num} short-answer questions from the context.
Difficulty: {difficulty}
{topic_line}

Keep model answers to 1-2 sentences maximum.

Return JSON array:
[{{"question_text":"...","correct_answer":"1-2 sentence answer","explanation":"Why this is correct","difficulty":"{difficulty}"}}]"""

DESCRIPTIVE_PROMPT = """Generate exactly {num} essay questions from the context.
Difficulty: {difficulty}
{topic_line}

Keep model answers to 3-5 sentences maximum. Be concise.

Return JSON array:
[{{"question_text":"...","correct_answer":"3-5 sentence model answer","explanation":"Key evaluation points","difficulty":"{difficulty}"}}]"""

_VALID_MCQ_KEYS = {"A", "B", "C", "D"}


class QuestionGeneratorService:
    def __init__(self, db: Session):
        self.db = db
        self.rag = RAGPipeline()

    def generate(
        self,
        course_id: int,
        exam_id: int,
        num_questions: int = 5,
        question_type: str = "mcq",
        difficulty: str = "medium",
        topic: Optional[str] = None,
        marks: Optional[float] = None,
    ) -> List[ExamQuestion]:

        topic_line = f"Focus on: {topic}" if topic else ""
        search_query = topic or "key concepts important topics"

        # ── Retrieve context ──────────────────────────────────────────────────
        passages = self.rag.retrieve_context(course_id, search_query, top_k=10)

        if not passages:
            from app.models.content import ContentDocument, ContentPassage
            docs = self.db.query(ContentDocument).filter(
                ContentDocument.course_id == course_id
            ).all()

            if not docs:
                # No documents at all
                raise ValueError(
                    "No course content found. "
                    "Please upload and index course files (PDF, DOCX, PPTX) first "
                    "before generating questions."
                )

            indexed_docs = [d for d in docs if d.upload_status == "indexed"]
            unindexed_docs = [d for d in docs if d.upload_status != "indexed"]

            if not indexed_docs and unindexed_docs:
                names = ", ".join(d.original_filename for d in unindexed_docs)
                raise ValueError(
                    f"Documents are uploaded but not yet indexed: {names}. "
                    "Please click 'Index' on each document in Content Manager before generating questions."
                )

            if topic:
                logger.warning(
                    "No vector search results for course %d topic '%s'. "
                    "Proceeding with general knowledge fallback.",
                    course_id, topic,
                )
                passages = []
            else:
                # Documents are indexed but no results returned — likely scanned PDFs
                doc_names = ", ".join(d.original_filename for d in indexed_docs)
                raise ValueError(
                    f"No readable text found in indexed documents ({doc_names}). "
                    "The files may be scanned/image-only PDFs. "
                    "Upload a text-based document or set a Topic Focus to generate from general knowledge."
                )

        # ── Capture top passage ID for audit trail ────────────────────────────
        # passages is a list of dicts with at least {"id": ..., "text": ...}
        top_passage_id: Optional[int] = None
        if passages and isinstance(passages[0], dict):
            top_passage_id = passages[0].get("id")

        # ── Enforce exam marks limit ──────────────────────────────────────────
        exam = self.db.query(Exam).filter(Exam.id == exam_id).first()
        marks_per_q = marks if marks is not None else {"mcq": 1.0, "short_answer": 3.0, "descriptive": 5.0}.get(question_type, 1.0)

        if exam:
            current_total = sum(
                q.marks for q in self.db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
            )
            headroom = exam.total_marks - current_total
            # How many questions can we actually fit?
            if marks_per_q > headroom:
                raise ValueError(
                    f"Cannot add any questions: exam total_marks={exam.total_marks}, "
                    f"current_marks={current_total}, marks_per_question={marks_per_q}. "
                    "Reduce marks per question or total_marks budget."
                )
            max_can_add = int(headroom // marks_per_q)
            if num_questions > max_can_add:
                logger.warning(
                    "Requested %d questions but only headroom for %d (marks budget). Capping.",
                    num_questions, max_can_add
                )
                num_questions = max_can_add
            if num_questions <= 0:
                raise ValueError(
                    f"Marks budget exhausted. Exam allows {exam.total_marks} total marks; "
                    f"{current_total} already assigned."
                )

        if question_type == "mixed":
            mcq_n = max(1, num_questions // 3)
            short_n = max(1, num_questions // 3)
            desc_n = num_questions - mcq_n - short_n
            questions = []
            if mcq_n > 0:
                questions += self._gen_type(passages, "mcq", mcq_n, difficulty, topic_line, exam_id, marks, top_passage_id)
            if short_n > 0:
                questions += self._gen_type(passages, "short_answer", short_n, difficulty, topic_line, exam_id, marks, top_passage_id)
            if desc_n > 0:
                questions += self._gen_type(passages, "descriptive", desc_n, difficulty, topic_line, exam_id, marks, top_passage_id)
            return questions
        else:
            return self._gen_type(passages, question_type, num_questions, difficulty, topic_line, exam_id, marks, top_passage_id)

    def _gen_type(
        self, passages, qtype, num, difficulty, topic_line, exam_id, marks,
        top_passage_id: Optional[int] = None,
    ) -> List[ExamQuestion]:
        templates = {
            "mcq": MCQ_PROMPT,
            "short_answer": SHORT_ANSWER_PROMPT,
            "descriptive": DESCRIPTIVE_PROMPT,
        }
        template = templates.get(qtype, MCQ_PROMPT)
        user_prompt = template.format(num=num, difficulty=difficulty, topic_line=topic_line)

        token_limits = {"mcq": 4096, "short_answer": 4096, "descriptive": 8192}

        raw = self.rag.generate_with_context(
            passages, user_prompt, SYSTEM_PROMPT,
            temperature=0.3,
            max_tokens=token_limits.get(qtype, 4096),
        )

        questions_data = self._parse_json(raw)
        if not questions_data:
            retry_prompt = (
                user_prompt
                + "\n\nIMPORTANT: Return ONLY the JSON array. No markdown. No ```json. Just the raw [ ... ] array."
            )
            raw = self.rag.generate_with_context(
                passages, retry_prompt, SYSTEM_PROMPT,
                temperature=0.2,
                max_tokens=token_limits.get(qtype, 4096),
            )
            questions_data = self._parse_json(raw)

        if not questions_data:
            raise ValueError(
                f"Failed to parse LLM response for {qtype} questions. "
                "The AI response was not valid JSON."
            )

        max_idx = (
            self.db.query(func.max(ExamQuestion.order_index))
            .filter(ExamQuestion.exam_id == exam_id)
            .scalar()
        ) or 0

        marks_map = {"mcq": 1.0, "short_answer": 3.0, "descriptive": 5.0}
        created: List[ExamQuestion] = []

        for i, qd in enumerate(questions_data[:num]):
            if not isinstance(qd, dict):
                continue
            question_text = qd.get("question_text", "").strip()
            correct_answer = qd.get("correct_answer", "").strip()
            if not question_text or not correct_answer:
                continue

            options = qd.get("options")

            # ── MCQ sanity-check ─────────────────────────────────────────────
            if qtype == "mcq":
                if not isinstance(options, dict):
                    logger.warning("Skipping MCQ with missing/invalid options dict: %s", question_text[:60])
                    continue
                if set(options.keys()) != _VALID_MCQ_KEYS:
                    logger.warning(
                        "Skipping MCQ with non-standard option keys %s: %s",
                        sorted(options.keys()), question_text[:60]
                    )
                    continue
                if correct_answer.upper() not in _VALID_MCQ_KEYS:
                    logger.warning(
                        "Skipping MCQ with invalid correct_answer '%s': %s",
                        correct_answer, question_text[:60]
                    )
                    continue
                correct_answer = correct_answer.upper()

            q = ExamQuestion(
                exam_id=exam_id,
                question_text=question_text,
                question_type=qtype,
                options=options,
                correct_answer=correct_answer,
                marks=marks if marks is not None else marks_map.get(qtype, 1.0),
                explanation=qd.get("explanation", ""),
                difficulty=qd.get("difficulty", difficulty),
                order_index=max_idx + i + 1,
                source_passage_id=top_passage_id,   # ← audit trail
            )
            self.db.add(q)
            created.append(q)

        self.db.commit()
        for q in created:
            self.db.refresh(q)

        logger.info("Generated %d %s questions for exam %d (source_passage_id=%s)",
                    len(created), qtype, exam_id, top_passage_id)
        return created

    @staticmethod
    def _parse_json(text: str) -> list:
        """
        Robust JSON extraction from LLM output.
        Handles: markdown fences, truncated JSON, mixed text.
        """
        if not text or not text.strip():
            return []

        text = text.strip()

        # Step 1: Remove markdown code fences
        text = re.sub(r'^```(?:json)?\s*\n?', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n?```\s*$', '', text, flags=re.MULTILINE)
        text = text.strip()

        # Step 2: Try direct parse
        try:
            data = json.loads(text)
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                return [data]
        except json.JSONDecodeError:
            pass

        # Step 3: Find JSON array in text
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1 and end > start:
            json_str = text[start: end + 1]
            try:
                data = json.loads(json_str)
                if isinstance(data, list):
                    return data
            except json.JSONDecodeError:
                pass

        # Step 4: Try to fix truncated JSON
        if start != -1:
            json_str = text[start:]
            if "]" not in json_str:
                last_brace = json_str.rfind("}")
                if last_brace != -1:
                    json_str = json_str[:last_brace + 1] + "]"
                    try:
                        data = json.loads(json_str)
                        if isinstance(data, list):
                            logger.warning("Recovered %d items from truncated JSON", len(data))
                            return data
                    except json.JSONDecodeError:
                        pass

            # Parse individual objects
            try:
                inner = json_str.strip().lstrip("[").rstrip("]")
                objects = []
                depth = 0
                current = ""
                for char in inner:
                    current += char
                    if char == "{":
                        depth += 1
                    elif char == "}":
                        depth -= 1
                        if depth == 0:
                            obj_str = current.strip().strip(",").strip()
                            try:
                                obj = json.loads(obj_str)
                                objects.append(obj)
                            except json.JSONDecodeError:
                                pass
                            current = ""
                if objects:
                    logger.warning("Recovered %d items by parsing individual objects", len(objects))
                    return objects
            except Exception:
                pass

        # Step 5: Regex extraction
        objects = []
        for match in re.finditer(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text):
            try:
                obj = json.loads(match.group())
                if "question_text" in obj:
                    objects.append(obj)
            except json.JSONDecodeError:
                continue

        if objects:
            logger.warning("Recovered %d questions by regex extraction", len(objects))
            return objects

        logger.error("JSON parse completely failed. Response preview: %s", text[:500])
        return []