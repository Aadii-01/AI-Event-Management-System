import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "AI Event Management System"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/event_db"
    
    # AI Providers
    GROQ_API_KEY: Optional[str] = ""
    GROQ_MODEL: str = "llama3-8b-8192"
    
    # Hugging Face
    HF_API_KEY: Optional[str] = ""
    HF_MODEL: str = "tiiuae/falcon-7b-instruct"
    
    # AI Fallback Active provider
    DEFAULT_AI_PROVIDER: str = "mock"
    
    # Mail Settings
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "notifications@eventmanagement.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
