"""
Application Configuration
Loads environment variables and provides settings for the application.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database Configuration
    DATABASE_URL: str = "sqlite:///./examinal.db"
    
    # JWT Configuration
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS Configuration
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Application Info
    APP_NAME: str = "Examinal"
    DEBUG: bool = True
    
    # AI Configuration
    NVIDIA_API_KEY: Optional[str] = None
    CHROMA_DB_DIR: str = "chroma_db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()
