import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Numeric, Text, JSON, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False, index=True)  # "admin", "organizer", "attendee"
    description = Column(String(200), nullable=True)
    
    users = relationship("User", back_populates="role_rel")


class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    role_rel = relationship("Role", back_populates="users")
    organized_events = relationship("Event", back_populates="organizer")
    registrations = relationship("Registration", back_populates="user")
    tickets = relationship("Ticket", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class EventCategory(Base):
    __tablename__ = "event_categories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    events = relationship("Event", back_populates="category")


class Event(Base):
    __tablename__ = "events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(String(36), ForeignKey("event_categories.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    venue = Column(String(200), nullable=False)
    capacity = Column(Integer, nullable=False)
    banner_image = Column(String(500), nullable=True)  # URL or local filename
    
    # Store list of ticket types, e.g., [{"name": "VIP", "price": 100.0, "capacity": 50}, ...]
    ticket_types = Column(JSON, nullable=False, default=list)
    
    organizer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="draft")  # "draft", "published"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    category = relationship("EventCategory", back_populates="events")
    organizer = relationship("User", back_populates="organized_events")
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="event", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="event", cascade="all, delete-orphan")
    ai_generations = relationship("AIGeneration", back_populates="event", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="event", cascade="all, delete-orphan")


class Registration(Base):
    __tablename__ = "registrations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    registration_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="confirmed")  # "confirmed", "cancelled"
    
    # Relationships
    user = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    ticket = relationship("Ticket", back_populates="registration", uselist=False, cascade="all, delete-orphan")


class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    registration_id = Column(String(36), ForeignKey("registrations.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    ticket_type = Column(String(50), nullable=False)  # "free", "paid", "vip", "early_bird"
    price = Column(Numeric(10, 2), default=0.00)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="active")  # "active", "cancelled", "checked_in"
    qr_code = Column(Text, nullable=True)  # Base64 encoded or path
    
    # Relationships
    registration = relationship("Registration", back_populates="ticket")
    user = relationship("User", back_populates="tickets")
    event = relationship("Event", back_populates="tickets")
    payment = relationship("Payment", back_populates="ticket", uselist=False, cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String(20), default="completed")  # "pending", "completed", "failed"
    transaction_id = Column(String(100), unique=True, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ticket = relationship("Ticket", back_populates="payment")


class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    timeline = Column(JSON, nullable=False)  # {"Day 1": [...], "Day 2": [...], "Recommendations": [...]}
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="schedules")


class AIGeneration(Base):
    __tablename__ = "ai_generations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    response = Column(JSON, nullable=False)
    type = Column(String(20), nullable=False)  # "schedule", "insights"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="ai_generations")


class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    metric_name = Column(String(100), nullable=False)  # "views", "registrations", "revenue"
    metric_value = Column(Numeric(12, 2), nullable=False)
    recorded_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="analytics")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)  # "registration_success", "ticket_purchase", "event_reminder", "schedule_change"
    content = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # "pending", "sent", "failed"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")


class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, nullable=False, index=True)  # "active_ai_provider", "groq_api_key", etc.
    value = Column(Text, nullable=True)
    description = Column(String(250), nullable=True)
