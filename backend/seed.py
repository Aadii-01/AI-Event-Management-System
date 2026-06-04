import logging
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import SessionLocal, Base, engine
from app.models import Role, User, EventCategory, Event, Registration, Ticket, Payment, AIGeneration, Analytics, SystemSetting
from app.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_seeder():
    # Ensure tables are created first
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        logger.info("Starting database seeding...")
        
        # 1. Check if users are already seeded to prevent duplication
        admin_user = db.query(User).filter(User.email == "admin@eventmanagement.com").first()
        if admin_user:
            logger.info("Database is already seeded. Skipping.")
            return

        # 2. Seed Roles (safeguard)
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Admin role")
            db.add(admin_role)
            
        organizer_role = db.query(Role).filter(Role.name == "organizer").first()
        if not organizer_role:
            organizer_role = Role(name="organizer", description="Organizer role")
            db.add(organizer_role)
            
        attendee_role = db.query(Role).filter(Role.name == "attendee").first()
        if not attendee_role:
            attendee_role = Role(name="attendee", description="Attendee role")
            db.add(attendee_role)
            
        db.commit()
        db.refresh(admin_role)
        db.refresh(organizer_role)
        db.refresh(attendee_role)

        # 3. Create Users
        admin = User(
            email="admin@eventmanagement.com",
            hashed_password=get_password_hash("password123"),
            full_name="System Administrator",
            role_id=admin_role.id
        )
        db.add(admin)
        
        organizer = User(
            email="organizer@eventmanagement.com",
            hashed_password=get_password_hash("password123"),
            full_name="Sarah Jenkins (Organizer)",
            role_id=organizer_role.id
        )
        db.add(organizer)
        
        attendee = User(
            email="attendee@eventmanagement.com",
            hashed_password=get_password_hash("password123"),
            full_name="John Doe (Attendee)",
            role_id=attendee_role.id
        )
        db.add(attendee)
        
        db.commit()
        db.refresh(organizer)
        db.refresh(attendee)

        # 4. Create Categories (safeguard)
        tech_cat = db.query(EventCategory).filter(EventCategory.name == "Technology").first()
        if not tech_cat:
            tech_cat = EventCategory(name="Technology", description="Tech events")
            db.add(tech_cat)
            
        business_cat = db.query(EventCategory).filter(EventCategory.name == "Business").first()
        if not business_cat:
            business_cat = EventCategory(name="Business", description="Business talks")
            db.add(business_cat)
            
        db.commit()
        db.refresh(tech_cat)
        db.refresh(business_cat)

        # 5. Create Events
        event1 = Event(
            title="Global AI Summit 2026",
            description="Explore the future of generative models, LLMs, agents, and cloud computing architectures.",
            category_id=tech_cat.id,
            start_date=datetime.utcnow() + timedelta(days=10),
            end_date=datetime.utcnow() + timedelta(days=12),
            venue="Silicon Valley Convention Center",
            capacity=500,
            banner_image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
            ticket_types=[
                {"name": "Free Admission", "price": 0.0, "capacity": 200},
                {"name": "VIP Pass", "price": 250.0, "capacity": 50},
                {"name": "General Entry", "price": 99.0, "capacity": 250}
            ],
            organizer_id=organizer.id,
            status="published"
        )
        db.add(event1)
        
        event2 = Event(
            title="FinTech Innovation Panel",
            description="Discussing decentralized finance, blockchains, and next-generation transaction protocols.",
            category_id=business_cat.id,
            start_date=datetime.utcnow() + timedelta(days=20),
            end_date=datetime.utcnow() + timedelta(days=20, hours=6),
            venue="Metropolitan Business Club",
            capacity=100,
            banner_image="https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800&auto=format&fit=crop&q=60",
            ticket_types=[
                {"name": "General Admission", "price": 45.0, "capacity": 100}
            ],
            organizer_id=organizer.id,
            status="published"
        )
        db.add(event2)

        event3 = Event(
            title="AI Art and Creativity Workshop (Draft)",
            description="Hands-on workshop using Diffusion models and neural networks to create fine art.",
            category_id=tech_cat.id,
            start_date=datetime.utcnow() + timedelta(days=4),
            end_date=datetime.utcnow() + timedelta(days=4, hours=4),
            venue="Tech Innovators Hub",
            capacity=30,
            banner_image="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=60",
            ticket_types=[
                {"name": "Workshop Ticket", "price": 75.0, "capacity": 30}
            ],
            organizer_id=organizer.id,
            status="draft"
        )
        db.add(event3)
        
        db.commit()
        db.refresh(event1)
        db.refresh(event2)

        # 6. Create registrations & tickets for Attendee
        # Reg 1: Global AI Summit (Free Admission)
        reg1 = Registration(user_id=attendee.id, event_id=event1.id, status="confirmed", registration_date=datetime.utcnow() - timedelta(days=3))
        db.add(reg1)
        db.commit()
        db.refresh(reg1)
        
        t1 = Ticket(
            registration_id=reg1.id,
            user_id=attendee.id,
            event_id=event1.id,
            ticket_type="Free Admission",
            price=Decimal("0.0"),
            status="active",
            qr_code=reg1.id
        )
        db.add(t1)
        
        # Reg 2: FinTech Innovation Panel (Paid General Admission)
        reg2 = Registration(user_id=attendee.id, event_id=event2.id, status="confirmed", registration_date=datetime.utcnow() - timedelta(days=1))
        db.add(reg2)
        db.commit()
        db.refresh(reg2)
        
        t2 = Ticket(
            registration_id=reg2.id,
            user_id=attendee.id,
            event_id=event2.id,
            ticket_type="General Admission",
            price=Decimal("45.0"),
            status="active",
            qr_code=reg2.id
        )
        db.add(t2)
        db.commit()
        db.refresh(t2)
        
        pay2 = Payment(
            ticket_id=t2.id,
            amount=Decimal("45.0"),
            payment_status="completed",
            transaction_id="TXN-SAMPLE-100234",
            payment_date=datetime.utcnow() - timedelta(days=1)
        )
        db.add(pay2)
        
        # 7. Create Dummy AI Schedule Log
        ai_gen = AIGeneration(
            event_id=event1.id,
            prompt="Type: Technical Conference, Sessions: 10, Speakers: 3, Days: 2",
            response={
                "Day1": [
                    {"time": "09:00 AM", "title": "Opening Keynote", "speaker": "Dr. Jane Doe", "venue": "Grand Hall", "description": "AI Revolution"}
                ],
                "Recommendations": ["Ensure sound checks are done early"]
            },
            type="schedule"
        )
        db.add(ai_gen)
        
        # 8. Create historical registrations in Analytics to populate charts
        # We can add historical records in registrations for date chart rendering
        for d in range(1, 6):
            historic_reg = Registration(
                user_id=attendee.id,
                event_id=event1.id,
                status="confirmed",
                registration_date=datetime.utcnow() - timedelta(days=d)
            )
            db.add(historic_reg)
            
        db.commit()
        logger.info("Database seeded successfully with sample data.")
        
    except Exception as e:
        logger.error(f"Failed to seed database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_seeder()
