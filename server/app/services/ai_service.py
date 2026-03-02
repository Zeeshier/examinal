import os
import json
import logging
from typing import List, Dict, Any, Optional
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

# --- Configuration ---
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
embedding_function = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
VECTOR_STORE_PATH = "faiss_index"

class AIService:
    @staticmethod
    def get_vector_store():
        """
        Get or create the FAISS vector store.
        """
        if os.path.exists(VECTOR_STORE_PATH) and os.path.exists(f"{VECTOR_STORE_PATH}/index.faiss"):
            try:
                return FAISS.load_local(
                    VECTOR_STORE_PATH, 
                    embedding_function, 
                    allow_dangerous_deserialization=True
                )
            except Exception as e:
                logger.error(f"Failed to load FAISS index: {e}")
                return None
        return None

    @staticmethod
    async def process_and_store_document(text: str, exam_id: int):
        """
        Chunks text, creates embeddings, and stores them in FAISS.
        """
        try:
            # 1. Split Text
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
            )
            chunks = splitter.create_documents([text])
            
            # 2. Add Metadata
            for chunk in chunks:
                chunk.metadata = {"exam_id": str(exam_id)}
                
            # 3. Store in FAISS
            vector_store = AIService.get_vector_store()
            
            if vector_store:
                # Add to existing
                vector_store.add_documents(chunks)
            else:
                # Create new
                vector_store = FAISS.from_documents(chunks, embedding_function)
            
            # 4. Save to disk
            vector_store.save_local(VECTOR_STORE_PATH)
            
            logger.info(f"Stored {len(chunks)} chunks for exam {exam_id}")
            return True
        except Exception as e:
            logger.error(f"Error processing document for exam {exam_id}: {e}")
            raise e

    @staticmethod
    async def generate_questions(exam_id: int, num_questions: int = 5, difficulty: str = "medium", question_type: str = "mixed") -> List[Dict]:
        """
        RAG Pipeline: Retrieve context -> Prompt NVIDIA AI -> Return JSON
        Falls back gracefully if AI or FAISS fails.
        """
        if not settings.NVIDIA_API_KEY:
            raise ValueError("NVIDIA_API_KEY is not set. Please add it to your .env file.")

        vector_store = AIService.get_vector_store()
        
        context_text = ""
        
        if vector_store:
            try:
                # Try to search with filter first
                docs = vector_store.similarity_search(
                    query=f"Generate {difficulty} questions about main topics",
                    k=10
                )
                
                # Filter by exam_id manually for reliability
                filtered_docs = [d for d in docs if d.metadata.get('exam_id') == str(exam_id)]
                final_docs = filtered_docs[:6] if filtered_docs else docs[:6]
                context_text = "\n\n".join([d.page_content for d in final_docs])
            except Exception as e:
                logger.error(f"FAISS search failed: {e}")
        
        if not context_text:
            raise ValueError("No document content found. Please upload a document first.")

        # Build prompt based on question type
        type_instruction = ""
        if question_type == "objective":
            type_instruction = "ALL questions must be Multiple Choice (objective) with 4 options each."
        elif question_type == "subjective":
            type_instruction = "ALL questions must be Subjective (short/long answer) with model answers."
        else:
            type_instruction = "Create a mix of Multiple Choice and Subjective questions."

        prompt = f"""
        You are an expert exam setter. Using the provided Context, generate exactly {num_questions} questions.
        Difficulty Level: {difficulty}
        
        Context:
        {context_text}
        
        Instructions:
        1. {type_instruction}
        2. RETURN ONLY RAW JSON. No markdown formatting, no explanation, no extra text.
        3. The format must match this schema EXACTLY:
        [
          {{
            "question_text": "Question goes here?",
            "type": "objective",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A"
          }},
          {{
            "question_text": "Question goes here?",
            "type": "subjective",
            "model_answer": "The expected comprehensive answer..."
          }}
        ]
        
        Generate exactly {num_questions} questions now:
        """

        # Call NVIDIA AI
        llm = ChatNVIDIA(
            model="qwen/qwen2.5-coder-32b-instruct",
            api_key=settings.NVIDIA_API_KEY,
            temperature=0.2,
            top_p=0.7,
            max_tokens=4096,
        )
        
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Clean markdown wrappers
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
            
        try:
            questions_json = json.loads(content)
            if isinstance(questions_json, list):
                return questions_json
            raise ValueError("Expected a list of questions")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse JSON from LLM: {content[:500]}")
            raise ValueError(f"AI generation failed to produce valid JSON: {e}")


    @staticmethod
    async def grade_subjective_answer(
        question_text: str, 
        model_answer: str, 
        student_answer: str
    ) -> Dict:
        """
        AI Grading logic remains the same.
        """
        if not settings.NVIDIA_API_KEY:
             raise ValueError("NVIDIA_API_KEY is not set")
             
        prompt = f"""
        You are a strict professor grading an exam.
        
        Question: {question_text}
        Reference Answer: {model_answer}
        Student Answer: {student_answer}
        
        Score (0-100) and provide strict feedback.
        Output JSON:
        {{
            "score": <int>,
            "feedback": "<string>"
        }}
        """

        llm = ChatNVIDIA(
            model="qwen/qwen2.5-coder-32b-instruct",
            api_key=settings.NVIDIA_API_KEY,
            temperature=0.1,
            top_p=0.7,
            max_tokens=1024,
        )
        
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]

        try:
            result = json.loads(content)
            return result
        except json.JSONDecodeError:
             return {"score": 0, "feedback": "Error parsing AI grading response."}
