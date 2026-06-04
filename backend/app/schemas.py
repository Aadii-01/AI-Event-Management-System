from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: str

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role_name: str = "attendee"  # "admin", "organizer", "attendee"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserChangeRole(BaseModel):
    role_name: str

# Event Category Schemas
class EventCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class EventCategoryCreate(EventCategoryBase):
    pass

class EventCategoryResponse(EventCategoryBase):
    id: str

    class Config:
        from_attributes = True

# Ticket Type (Stored inside Event's ticket_types JSON)
class TicketType(BaseModel):
    name: str  # "Free", "VIP", "Early Bird", "General Admission"
    price: float
    capacity: int

# Event Schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    venue: str
    capacity: int
    ticket_types: List[TicketType] = []
    banner_image: Optional[str] = None

class EventCreate(EventBase):
    category_id: str

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    venue: Optional[str] = None
    capacity: Optional[int] = None
    ticket_types: Optional[List[TicketType]] = None
    banner_image: Optional[str] = None
    status: Optional[str] = None  # "draft", "published"

class EventResponse(EventBase):
    id: str
    category_id: str
    organizer_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Registration Schemas
class RegistrationCreate(BaseModel):
    ticket_type: str  # must match one of the event's ticket types

class RegistrationResponse(BaseModel):
    id: str
    user_id: str
    event_id: str
    registration_date: datetime
    status: str

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    ticket_id: str
    amount: float
    transaction_id: str

class PaymentResponse(BaseModel):
    id: str
    ticket_id: str
    amount: Decimal
    payment_status: str
    transaction_id: str
    payment_date: datetime

    class Config:
        from_attributes = True

# Ticket Schemas
class TicketResponse(BaseModel):
    id: str
    registration_id: str
    user_id: str
    event_id: str
    ticket_type: str
    price: Decimal
    purchase_date: datetime
    status: str
    qr_code: Optional[str] = None

    class Config:
        from_attributes = True

class TicketDetailsResponse(TicketResponse):
    event_title: str
    event_start_date: datetime
    event_venue: str
    attendee_name: str

# Schedule Schemas
class ScheduleResponse(BaseModel):
    id: str
    event_id: str
    timeline: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ScheduleUpdate(BaseModel):
    timeline: Dict[str, Any]

# AI Generation Request Schemas
class AIScheduleRequest(BaseModel):
    event_type: str = Field(..., example="Technical Conference")
    num_sessions: int = Field(10, ge=1)
    num_speakers: int = Field(3, ge=1)
    duration_days: int = Field(2, ge=1)
    break_preferences: str = Field("networking breaks and keynote sessions", example="1 hour lunch break, 15 min coffee breaks")
    audience_type: str = Field("software developers", example="corporate professionals")

class AIInsightsRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    venue: str
    capacity: int
    ticket_types: List[TicketType]

class AIInsightsResponse(BaseModel):
    attendance_prediction: str
    ticket_demand_forecast: str
    suggested_timing: str
    suggested_category: str
    audience_recommendations: List[str]
    explanation: str

# System Configuration
class SystemSettingUpdate(BaseModel):
    key: str
    value: str

class SystemSettingResponse(BaseModel):
    id: str
    key: str
    value: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class AIConfigUpdate(BaseModel):
    primary_provider: str  # "groq" or "huggingface" or "mock"
    groq_api_key: Optional[str] = None
    hf_api_key: Optional[str] = None
