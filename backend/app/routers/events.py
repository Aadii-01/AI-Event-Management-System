from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import User, EventCategory, Event
from app.schemas import EventCreate, EventResponse, EventUpdate, EventCategoryResponse, EventCategoryCreate
from app.security import get_current_user, RoleChecker
from app.crud import (
    get_event, get_events, create_event, update_event, delete_event,
    get_categories, create_category, get_category_by_name
)

router = APIRouter(prefix="/events", tags=["Event Management"])

# Categories
@router.get("/categories", response_model=List[EventCategoryResponse])
def read_categories(db: Session = Depends(get_db)):
    return get_categories(db)

@router.post("/categories", response_model=EventCategoryResponse, status_code=status.HTTP_201_CREATED)
def add_category(
    category_in: EventCategoryCreate,
    current_user: User = Depends(RoleChecker(["admin", "organizer"])),
    db: Session = Depends(get_db)
):
    db_cat = get_category_by_name(db, name=category_in.name)
    if db_cat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists."
        )
    return create_category(db, name=category_in.name, description=category_in.description)

# Events CRUD
@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_new_event(
    event_in: EventCreate,
    current_user: User = Depends(RoleChecker(["organizer", "admin"])),
    db: Session = Depends(get_db)
):
    # Verify category exists
    category = db.query(EventCategory).filter(EventCategory.id == event_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID."
        )
    return create_event(db, event_in=event_in, organizer_id=current_user.id)

@router.get("/", response_model=List[EventResponse])
def read_all_events(
    category_id: Optional[str] = None,
    organizer_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db)
):
    # By default, public search only shows published events, unless custom queries or auth details are used
    events = get_events(
        db, category_id=category_id, organizer_id=organizer_id, status=status, search=search, skip=skip, limit=limit
    )
    return events

@router.get("/{event_id}", response_model=EventResponse)
def read_event(event_id: str, db: Session = Depends(get_db)):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found."
        )
    return event

@router.put("/{event_id}", response_model=EventResponse)
def update_existing_event(
    event_id: str,
    event_in: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found."
        )
        
    # Check permissions
    role = current_user.role_rel.name if current_user.role_rel else ""
    if event.organizer_id != current_user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this event."
        )
        
    return update_event(db, event=event, event_in=event_in)

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found."
        )
        
    # Check permissions
    role = current_user.role_rel.name if current_user.role_rel else ""
    if event.organizer_id != current_user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this event."
        )
        
    delete_event(db, event_id)
    return None
