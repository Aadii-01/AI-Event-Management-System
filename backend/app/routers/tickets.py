import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Ticket, Payment, Event, Registration
from app.schemas import TicketResponse, TicketDetailsResponse, PaymentCreate, PaymentResponse
from app.security import get_current_user, RoleChecker
from app.crud import get_ticket, get_tickets_by_user, create_payment, create_notification, get_event, get_user_by_id
from app.services.pdf_service import PDFService
from app.services.email_service import EmailService

router = APIRouter(prefix="/tickets", tags=["Ticketing System"])

@router.post("/purchase", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def purchase_ticket_payment(
    payment_in: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = get_ticket(db, payment_in.ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket/Registration record not found."
        )
        
    # Check if payment already exists for this ticket
    existing_pay = db.query(Payment).filter(Payment.ticket_id == ticket.id).first()
    if existing_pay:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already completed for this ticket."
        )
        
    # Record payment
    payment = create_payment(db, payment_in=payment_in)
    
    # Update ticket status to active
    ticket.status = "active"
    db.commit()
    
    event = get_event(db, ticket.event_id)
    
    # Send email receipt
    EmailService.send_ticket_purchase(
        to_email=current_user.email,
        attendee_name=current_user.full_name,
        event_title=event.title if event else "Event",
        ticket_type=ticket.ticket_type,
        amount=float(payment.amount)
    )
    
    # Record notification
    create_notification(
        db,
        user_id=current_user.id,
        type="ticket_purchase",
        content=f"Receipt generated for your ticket purchase to {event.title if event else 'Event'}"
    )
    
    return payment

@router.get("/my", response_model=List[TicketDetailsResponse])
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tickets = get_tickets_by_user(db, user_id=current_user.id)
    response_tickets = []
    
    for t in tickets:
        event = db.query(Event).filter(Event.id == t.event_id).first()
        event_title = event.title if event else "Unknown Event"
        event_start_date = event.start_date if event else None
        event_venue = event.venue if event else "Unknown Venue"
        
        response_tickets.append(
            TicketDetailsResponse(
                id=t.id,
                registration_id=t.registration_id,
                user_id=t.user_id,
                event_id=t.event_id,
                ticket_type=t.ticket_type,
                price=t.price,
                purchase_date=t.purchase_date,
                status=t.status,
                qr_code=t.qr_code,
                event_title=event_title,
                event_start_date=event_start_date,
                event_venue=event_venue,
                attendee_name=current_user.full_name
            )
        )
        
    return response_tickets

@router.get("/{ticket_id}/pdf")
def download_ticket_as_pdf(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found."
        )
        
    event = get_event(db, ticket.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event details not found."
        )
        
    # Check permissions
    role = current_user.role_rel.name if current_user.role_rel else ""
    if ticket.user_id != current_user.id and event.organizer_id != current_user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to download this ticket."
        )
        
    # Fetch ticket owner's details
    ticket_owner = get_user_by_id(db, ticket.user_id)
    attendee_name = ticket_owner.full_name if ticket_owner else "Attendee"
    attendee_email = ticket_owner.email if ticket_owner else "Email"
    
    # Generate the ticket PDF in memory
    pdf_buffer = PDFService.generate_ticket_pdf(
        ticket_id=ticket.id,
        event_title=event.title,
        start_date=event.start_date.strftime("%B %d, %Y - %I:%M %p"),
        venue=event.venue,
        ticket_type=ticket.ticket_type,
        price=f"${ticket.price:.2f}",
        attendee_name=attendee_name,
        attendee_email=attendee_email
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ticket_{ticket_id[:8]}.pdf"}
    )
