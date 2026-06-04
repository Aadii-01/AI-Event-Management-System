from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models import (
    Role, User, EventCategory, Event, Registration, Ticket, Payment, Schedule, AIGeneration, Analytics, Notification, SystemSetting
)
from app.schemas import UserCreate, EventCreate, EventUpdate, RegistrationCreate, PaymentCreate
from app.security import get_password_hash

# Role CRUD
def get_role_by_name(db: Session, name: str) -> Optional[Role]:
    return db.query(Role).filter(Role.name == name).first()

def create_role(db: Session, name: str, description: Optional[str] = None) -> Role:
    db_role = Role(name=name, description=description)
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

# User CRUD
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user_in: UserCreate) -> User:
    role = get_role_by_name(db, user_in.role_name)
    if not role:
        # Auto-create role if not exists (for seeding/migration safety)
        role = create_role(db, name=user_in.role_name)
        
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role_id=role.id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_role(db: Session, user: User, role_name: str) -> User:
    role = get_role_by_name(db, role_name)
    if role:
        user.role_id = role.id
        db.commit()
        db.refresh(user)
    return user

# Event Category CRUD
def get_category_by_name(db: Session, name: str) -> Optional[EventCategory]:
    return db.query(EventCategory).filter(EventCategory.name == name).first()

def get_categories(db: Session) -> List[EventCategory]:
    return db.query(EventCategory).all()

def create_category(db: Session, name: str, description: Optional[str] = None) -> EventCategory:
    db_category = EventCategory(name=name, description=description)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Event CRUD
def get_event(db: Session, event_id: str) -> Optional[Event]:
    return db.query(Event).filter(Event.id == event_id).first()

def get_events(
    db: Session,
    category_id: Optional[str] = None,
    organizer_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Event]:
    query = db.query(Event)
    if category_id:
        query = query.filter(Event.category_id == category_id)
    if organizer_id:
        query = query.filter(Event.organizer_id == organizer_id)
    if status:
        query = query.filter(Event.status == status)
    if search:
        query = query.filter(
            (Event.title.ilike(f"%{search}%")) | (Event.venue.ilike(f"%{search}%"))
        )
    return query.order_by(Event.start_date.asc()).offset(skip).limit(limit).all()

def create_event(db: Session, event_in: EventCreate, organizer_id: str) -> Event:
    db_event = Event(
        title=event_in.title,
        description=event_in.description,
        category_id=event_in.category_id,
        start_date=event_in.start_date,
        end_date=event_in.end_date,
        venue=event_in.venue,
        capacity=event_in.capacity,
        banner_image=event_in.banner_image,
        ticket_types=[tt.dict() for tt in event_in.ticket_types],
        organizer_id=organizer_id,
        status="draft"  # Default status is draft
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(db: Session, event: Event, event_in: EventUpdate) -> Event:
    update_data = event_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "ticket_types" and value is not None:
            setattr(event, field, [tt.dict() if hasattr(tt, "dict") else tt for tt in value])
        else:
            setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event

def delete_event(db: Session, event_id: str) -> bool:
    db_event = get_event(db, event_id)
    if db_event:
        db.delete(db_event)
        db.commit()
        return True
    return False

# Registration CRUD
def create_registration(db: Session, user_id: str, event_id: str) -> Registration:
    db_reg = Registration(user_id=user_id, event_id=event_id, status="confirmed")
    db.add(db_reg)
    db.commit()
    db.refresh(db_reg)
    return db_reg

def get_registration(db: Session, reg_id: str) -> Optional[Registration]:
    return db.query(Registration).filter(Registration.id == reg_id).first()

def get_user_registration_for_event(db: Session, user_id: str, event_id: str) -> Optional[Registration]:
    return db.query(Registration).filter(
        Registration.user_id == user_id,
        Registration.event_id == event_id,
        Registration.status == "confirmed"
    ).first()

def get_registrations_by_event(db: Session, event_id: str) -> List[Registration]:
    return db.query(Registration).filter(Registration.event_id == event_id).all()

def get_registrations_by_user(db: Session, user_id: str) -> List[Registration]:
    return db.query(Registration).filter(Registration.user_id == user_id).all()

# Ticket CRUD
def create_ticket(
    db: Session, registration_id: str, user_id: str, event_id: str, ticket_type: str, price: float, qr_code: Optional[str] = None
) -> Ticket:
    db_ticket = Ticket(
        registration_id=registration_id,
        user_id=user_id,
        event_id=event_id,
        ticket_type=ticket_type,
        price=price,
        status="active",
        qr_code=qr_code
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def get_ticket(db: Session, ticket_id: str) -> Optional[Ticket]:
    return db.query(Ticket).filter(Ticket.id == ticket_id).first()

def get_tickets_by_user(db: Session, user_id: str) -> List[Ticket]:
    return db.query(Ticket).filter(Ticket.user_id == user_id).all()

def get_tickets_by_event(db: Session, event_id: str) -> List[Ticket]:
    return db.query(Ticket).filter(Ticket.event_id == event_id).all()

# Payment CRUD
def create_payment(db: Session, payment_in: PaymentCreate) -> Payment:
    db_payment = Payment(
        ticket_id=payment_in.ticket_id,
        amount=payment_in.amount,
        payment_status="completed",
        transaction_id=payment_in.transaction_id
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

# Schedule CRUD
def get_schedule_by_event(db: Session, event_id: str) -> Optional[Schedule]:
    return db.query(Schedule).filter(Schedule.event_id == event_id).first()

def create_or_update_schedule(db: Session, event_id: str, timeline: Dict[str, Any]) -> Schedule:
    db_schedule = get_schedule_by_event(db, event_id)
    if db_schedule:
        db_schedule.timeline = timeline
        db_schedule.updated_at = datetime.utcnow()
    else:
        db_schedule = Schedule(event_id=event_id, timeline=timeline)
        db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

# AI Generation CRUD
def create_ai_generation(db: Session, event_id: str, prompt: str, response: Dict[str, Any], type: str) -> AIGeneration:
    db_ai = AIGeneration(event_id=event_id, prompt=prompt, response=response, type=type)
    db.add(db_ai)
    db.commit()
    db.refresh(db_ai)
    return db_ai

# Notification CRUD
def create_notification(db: Session, user_id: str, type: str, content: str) -> Notification:
    db_notif = Notification(user_id=user_id, type=type, content=content, status="pending")
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

# Settings CRUD
def get_system_setting(db: Session, key: str) -> Optional[SystemSetting]:
    return db.query(SystemSetting).filter(SystemSetting.key == key).first()

def set_system_setting(db: Session, key: str, value: str, description: Optional[str] = None) -> SystemSetting:
    setting = get_system_setting(db, key)
    if setting:
        setting.value = value
    else:
        setting = SystemSetting(key=key, value=value, description=description)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting
