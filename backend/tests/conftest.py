import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Adjust sys.path to run tests from backend root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import Base, get_db
from app.models import Role, User
from app.security import get_password_hash

from sqlalchemy.pool import StaticPool

# Use in-memory SQLite with StaticPool to share connection across sessions
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    # Setup tables
    Base.metadata.create_all(bind=engine)
    
    db_session = TestingSessionLocal()
    
    # Seed default roles required for users
    admin_role = Role(name="admin", description="Admin role")
    org_role = Role(name="organizer", description="Organizer role")
    att_role = Role(name="attendee", description="Attendee role")
    db_session.add_all([admin_role, org_role, att_role])
    db_session.commit()
    
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
