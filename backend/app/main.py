import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, events, registrations, tickets, ai, analytics, admin
from app.models import Role, EventCategory, SystemSetting

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Auto-create tables on startup (Simple Alembic alternative for immediate local setup)
try:
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database: {e}")

# Pre-populate database with default roles, categories, and settings
def seed_database():
    db = SessionLocal()
    try:
        # 1. Seed Roles
        default_roles = [
            ("admin", "Platform administrator with full system controls"),
            ("organizer", "Event organizer who hosts events and reviews schedules"),
            ("attendee", "General user registering for events and downloading tickets")
        ]
        for role_name, desc in default_roles:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                db.add(Role(name=role_name, description=desc))
                logger.info(f"Seeded role: {role_name}")
                
        # 2. Seed Event Categories
        default_categories = [
            ("Technology", "Technical meetups, conferences, and programming hackathons"),
            ("Business", "Corporate seminars, networking, and business talks"),
            ("Design", "Creative seminars, design workshops, and UX meetups"),
            ("Marketing", "Digital growth, sales strategy panels, and marketing hackathons"),
            ("Entertainment", "Music festivals, stage performance, and art shows")
        ]
        for cat_name, desc in default_categories:
            category = db.query(EventCategory).filter(EventCategory.name == cat_name).first()
            if not category:
                db.add(EventCategory(name=cat_name, description=desc))
                logger.info(f"Seeded category: {cat_name}")
                
        # 3. Seed AI Settings
        default_settings = [
            ("active_ai_provider", "groq", "Active AI provider for generating schedules"),
            ("groq_api_key", "", "API Token for Groq Cloud Interface"),
            ("hf_api_key", "", "API Token for Hugging Face Inference API")
        ]
        for key, val, desc in default_settings:
            setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not setting:
                db.add(SystemSetting(key=key, value=val, description=desc))
                logger.info(f"Seeded default setting: {key}")
                
        db.commit()
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

seed_database()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI-Powered Event Management Platform API with schedule and insights generation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(registrations.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to the AI-Powered Event Management API. Access docs at /docs"}
