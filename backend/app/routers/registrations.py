from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Event, Registration, Ticket
from app.schemas import RegistrationResponse, RegistrationCreate
from app.security import get_current_user, RoleChecker
from app.crud import (
    get_event, create_registration, get_user_registration_for_event,
    get_registrations_by_event, get_registrations_by_user, get_registration,
    create_notification, create_ticket
)
from app.services.email_service import EmailService
from app.services.pdf_service import PDFService

router = APIRouter(tags=["Registrations"])

# Attendee: Register for event
@router.post("/events/{event_id}/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: str,
    reg_in: RegistrationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found."
        )
    
    if event.status != "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot register for an unpublished event."
        )
        
    # Check if already registered
    existing_reg = get_user_registration_for_event(db, user_id=current_user.id, event_id=event_id)
    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already registered for this event."
        )
        
    # Check general event capacity
    active_regs_count = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == "confirmed"
    ).count()
    if active_regs_count >= event.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This event is at full capacity."
        )
        
    # Check ticket type selection matches event ticket types
    matched_tt = None
    for tt in event.ticket_types:
        if tt.get("name", "").lower() == reg_in.ticket_type.lower():
            matched_tt = tt
            break
            
    if not matched_tt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ticket type '{reg_in.ticket_type}' is not available for this event."
        )
        
    # Check ticket type capacity
    type_regs_count = db.query(Ticket).filter(
        Ticket.event_id == event_id,
        Ticket.ticket_type == matched_tt["name"],
        Ticket.status == "active"
    ).count()
    if type_regs_count >= matched_tt.get("capacity", event.capacity):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The ticket type '{matched_tt['name']}' is sold out."
        )
        
    # All validations passed: Perform registration
    reg = create_registration(db, user_id=current_user.id, event_id=event_id)
    
    # Create the Ticket object
    # For paid tickets, they should go through the purchase flow, but if price is 0 (free), we generate it immediately.
    # We also allow immediate registration for paid tickets here if simplicity is required, or let them buy it.
    # To support both, we issue the ticket. If it's paid, a payment record is generated.
    # In real flows, free tickets are immediate. Let's make it direct:
    price = matched_tt.get("price", 0.0)
    
    # Generate unique QR Code text (for example ticket ID)
    ticket = create_ticket(
        db,
        registration_id=reg.id,
        user_id=current_user.id,
        event_id=event_id,
        ticket_type=matched_tt["name"],
        price=price,
        qr_code=reg.id # QR code points to registration ID
    )
    
    # Send email notification asynchronously (simulate via background execution or direct block)
    EmailService.send_registration_success(
        to_email=current_user.email,
        attendee_name=current_user.full_name,
        event_title=event.title
    )
    
    # Record notification in DB
    create_notification(
        db,
        user_id=current_user.id,
        type="registration_success",
        content=f"Successfully registered for {event.title}"
    )
    
    return reg

# Attendee: View registration history
@router.get("/registrations/my", response_model=List[RegistrationResponse])
def get_my_registrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_registrations_by_user(db, user_id=current_user.id)

# Organizer: View event registrations
@router.get("/events/{event_id}/registrations", response_model=List[RegistrationResponse])
def get_event_registrations(
    event_id: str,
    current_user: User = Depends(RoleChecker(["organizer", "admin"])),
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
            detail="You do not have permission to view registrations for this event."
        )
        
    return get_registrations_by_event(db, event_id=event_id)

# Attendee/Organizer: Cancel registration
@router.put("/registrations/{reg_id}/cancel", response_model=RegistrationResponse)
def cancel_event_registration(
    reg_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reg = get_registration(db, reg_id)
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found."
        )
        
    event = get_event(db, reg.event_id)
    role = current_user.role_rel.name if current_user.role_rel else ""
    
    # Check authorization
    if reg.user_id != current_user.id and event.organizer_id != current_user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to cancel this registration."
        )
        
    reg.status = "cancelled"
    
    # Cancel corresponding ticket
    if reg.ticket:
        reg.ticket.status = "cancelled"
        
    db.commit()
    db.refresh(reg)
    
    # Record notification in DB
    create_notification(
        db,
        user_id=reg.user_id,
        type="registration_cancellation",
        content=f"Registration cancelled for event: {event.title}"
    )
    
    return reg
