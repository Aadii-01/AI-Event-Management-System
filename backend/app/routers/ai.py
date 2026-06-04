from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models import User, Event, Schedule, AIGeneration, Registration
from app.schemas import AIScheduleRequest, ScheduleResponse, ScheduleUpdate, AIInsightsRequest, AIInsightsResponse
from app.security import get_current_user, RoleChecker
from app.services.ai_service import AIService
from app.services.email_service import EmailService
from app.crud import get_event, create_or_update_schedule, create_ai_generation, create_notification

router = APIRouter(prefix="/ai", tags=["AI Scheduling & Insights"])

@router.post("/generate-schedule/{event_id}", response_model=ScheduleResponse)
def generate_event_schedule(
    event_id: str,
    req: AIScheduleRequest,
    current_user: User = Depends(RoleChecker(["organizer", "admin"])),
    db: Session = Depends(get_db)
):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
        
    # Check permissions
    role = current_user.role_rel.name if current_user.role_rel else ""
    if event.organizer_id != current_user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to generate a schedule for this event."
        )

    # Call AI generation service
    try:
        timeline = AIService.generate_schedule(
            db=db,
            event_type=req.event_type,
            num_sessions=req.num_sessions,
            num_speakers=req.num_speakers,
            duration_days=req.duration_days,
            break_preferences=req.break_preferences,
            audience_type=req.audience_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate schedule from AI service: {e}"
        )

    # Save generated schedule in Database
    schedule = create_or_update_schedule(db, event_id=event_id, timeline=timeline)
    
    # Log the generation query
    prompt_log = f"Type: {req.event_type}, Sessions: {req.num_sessions}, Speakers: {req.num_speakers}, Days: {req.duration_days}"
    create_ai_generation(db, event_id=event_id, prompt=prompt_log, response=timeline, type="schedule")
    
    # Save a metric in the analytics table for schedule generations
    # Let's count generations for AI metrics
    from app.models import Analytics
    from decimal import Decimal
    db_metric = Analytics(
        event_id=event_id,
        metric_name="ai_schedule_generations",
        metric_value=Decimal("1.0")
    )
    db.add(db_metric)
    db.commit()

    return schedule

@router.get("/schedule/{event_id}", response_model=ScheduleResponse)
def get_event_schedule(event_id: str, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.event_id == event_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No schedule generated for this event yet."
        )
    return schedule

@router.put("/schedule/{event_id}", response_model=ScheduleResponse)
def edit_event_schedule(
    event_id: str,
    req: ScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
        
    role = current_user.role_rel.name if current_user.role_rel else ""
    if event.organizer_id != current_user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit the schedule."
        )
        
    schedule = create_or_update_schedule(db, event_id=event_id, timeline=req.timeline)
    
    # Notify all registered attendees of the event about the schedule update
    registrations = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == "confirmed"
    ).all()
    
    for reg in registrations:
        attendee = reg.user
        if attendee:
            # Send notification email
            EmailService.send_schedule_change(
                to_email=attendee.email,
                attendee_name=attendee.full_name,
                event_title=event.title
            )
            # Log in notifications table
            create_notification(
                db,
                user_id=attendee.id,
                type="schedule_change",
                content=f"The schedule for event: '{event.title}' has been updated."
            )
            
    return schedule

@router.post("/generate-insights", response_model=AIInsightsResponse)
def get_event_insights(
    req: AIInsightsRequest,
    current_user: User = Depends(RoleChecker(["organizer", "admin"])),
    db: Session = Depends(get_db)
):
    # Call AI Service for predictions
    try:
        insights = AIService.generate_insights(
            db=db,
            title=req.title,
            description=req.description or "",
            category=req.category,
            venue=req.venue,
            capacity=req.capacity,
            ticket_types=[t.dict() for t in req.ticket_types]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {e}"
        )
        
    return AIInsightsResponse(
        attendance_prediction=insights.get("attendance_prediction", "Moderate Attendance"),
        ticket_demand_forecast=insights.get("ticket_demand_forecast", "Moderate Demand"),
        suggested_timing=insights.get("suggested_timing", "Weekend afternoon"),
        suggested_category=insights.get("suggested_category", req.category),
        audience_recommendations=insights.get("audience_recommendations", ["Local professionals"]),
        explanation=insights.get("explanation", "Insights compiled successfully.")
    )
