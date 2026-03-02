"""
Document Model
Stores uploaded file metadata and extracted text content.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db.session import Base


class Document(Base):
    """
    Document model for storing uploaded course materials.
    Text is extracted from PDFs/DOCX and stored for RAG processing.
    """
    __tablename__ = "documents"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(Integer, ForeignKey("exams.id"), nullable=False)
    
    # File metadata
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # pdf, docx
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # bytes
    
    # Extracted content
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Processing status
    is_processed: Mapped[bool] = mapped_column(default=False, nullable=False)
    processing_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    exam: Mapped["Exam"] = relationship("Exam", back_populates="documents")
    
    def __repr__(self) -> str:
        return f"<Document(id={self.id}, filename='{self.filename}', processed={self.is_processed})>"


# Import Exam here to avoid circular import
from app.models.models import Exam
