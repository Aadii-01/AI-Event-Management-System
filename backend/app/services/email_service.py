import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        # Check if SMTP settings are fully configured
        if not (settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD):
            # Fallback to local development log
            logger.info("====== SMTP NOT CONFIGURED: PRINTING EMAIL TO CONSOLE ======")
            logger.info(f"To: {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Body Preview: {text_content or html_content[:200]}...")
            logger.info("==========================================================")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = to_email

            # Attach text fallback
            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            else:
                msg.attach(MIMEText("Please enable HTML viewing to read this email.", "plain"))

            # Attach HTML content
            msg.attach(MIMEText(html_content, "html"))

            # Connect to SMTP server
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_PORT == 587:
                    server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
                
            logger.info(f"Successfully sent email to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email} due to error: {e}")
            return False

    @classmethod
    def send_registration_success(cls, to_email: str, attendee_name: str, event_title: str) -> bool:
        subject = f"Registration Confirmed: {event_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #6366f1;">Registration Confirmed!</h2>
                    <p>Dear <strong>{attendee_name}</strong>,</p>
                    <p>Congratulations! You have successfully registered for the event: <strong>{event_title}</strong>.</p>
                    <p>You can view and manage your ticket registrations directly on the event portal. Your QR ticket is ready to download.</p>
                    <br>
                    <p>Best regards,<br>The Event Management Team</p>
                </div>
            </body>
        </html>
        """
        text_content = f"Hi {attendee_name}, you have successfully registered for the event: {event_title}."
        return cls.send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_ticket_purchase(cls, to_email: str, attendee_name: str, event_title: str, ticket_type: str, amount: float) -> bool:
        subject = f"Ticket Purchase Invoice - {event_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #10b981;">Receipt & Invoice</h2>
                    <p>Dear <strong>{attendee_name}</strong>,</p>
                    <p>Thank you for your purchase! Below are your order details:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background-color: #f3f4f6;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Event</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Ticket Type</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Price Paid</th>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">{event_title}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{ticket_type.upper()}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${amount:.2f}</td>
                        </tr>
                    </table>
                    <p>Your ticket and barcode/QR code are attached to your account page. Please have it ready on your mobile device for entry.</p>
                    <br>
                    <p>Best regards,<br>The Event Management Team</p>
                </div>
            </body>
        </html>
        """
        text_content = f"Hi {attendee_name}, thank you for purchasing a {ticket_type} ticket for {event_title} for ${amount:.2f}."
        return cls.send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_schedule_change(cls, to_email: str, attendee_name: str, event_title: str) -> bool:
        subject = f"Alert: Schedule Updated for {event_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; border-top: 4px solid #ef4444;">
                    <h2 style="color: #ef4444;">Important Schedule Update</h2>
                    <p>Dear <strong>{attendee_name}</strong>,</p>
                    <p>This is to inform you that the organizers of <strong>{event_title}</strong> have updated the event schedule.</p>
                    <p>Please log in to your account page and check the Event Schedule Timeline for the latest timings, speaker lists, and room assignments.</p>
                    <br>
                    <p>Best regards,<br>The Event Management Team</p>
                </div>
            </body>
        </html>
        """
        text_content = f"Hi {attendee_name}, the schedule for the event: {event_title} has been updated. Please check the website."
        return cls.send_email(to_email, subject, html_content, text_content)
