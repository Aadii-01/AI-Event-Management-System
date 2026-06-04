import io
import base64
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class PDFService:
    @staticmethod
    def generate_qr_code_base64(data: str) -> str:
        """
        Generate a QR code image and return it as a Base64-encoded PNG.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_bytes = buffered.getvalue()
        
        # Return base64 string
        return base64.b64encode(qr_bytes).decode("utf-8")

    @classmethod
    def generate_ticket_pdf(
        cls,
        ticket_id: str,
        event_title: str,
        start_date: str,
        venue: str,
        ticket_type: str,
        price: str,
        attendee_name: str,
        attendee_email: str
    ) -> io.BytesIO:
        """
        Generate a ticket PDF in-memory and return a BytesIO buffer.
        """
        buffer = io.BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        # Generate QR code bytes
        qr_base64 = cls.generate_qr_code_base64(ticket_id)
        qr_bytes = base64.b64decode(qr_base64)
        qr_image_io = io.BytesIO(qr_bytes)
        
        # Styles
        styles = getSampleStyleSheet()
        
        # Custom styles for premium look
        title_style = ParagraphStyle(
            'TicketTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            textColor=colors.HexColor('#4f46e5'), # Indigo Accent
            spaceAfter=15
        )
        
        event_style = ParagraphStyle(
            'TicketEvent',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=10
        )
        
        body_style = ParagraphStyle(
            'TicketBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor('#4b5563'),
            spaceAfter=6
        )
        
        label_style = ParagraphStyle(
            'TicketLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=colors.HexColor('#111827'),
            spaceAfter=6
        )

        elements = []
        
        # Header banner table
        header_data = [
            [Paragraph("<b>ADMIT ONE</b>", title_style), Paragraph(f"TICKET ID: #{ticket_id[:8].upper()}", body_style)]
        ]
        header_table = Table(header_data, colWidths=[350, 190])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#4f46e5')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 20))
        
        # Main Body - Split into details (left) and QR code (right)
        qr_img = RLImage(qr_image_io, width=130, height=130)
        
        details_data = [
            [Paragraph("Event Name:", label_style), Paragraph(event_title, event_style)],
            [Paragraph("Date & Time:", label_style), Paragraph(start_date, body_style)],
            [Paragraph("Venue / Location:", label_style), Paragraph(venue, body_style)],
            [Paragraph("Attendee Name:", label_style), Paragraph(attendee_name, body_style)],
            [Paragraph("Attendee Email:", label_style), Paragraph(attendee_email, body_style)],
            [Paragraph("Ticket Type:", label_style), Paragraph(ticket_type.upper(), body_style)],
            [Paragraph("Price Paid:", label_style), Paragraph(price, body_style)],
        ]
        details_table = Table(details_data, colWidths=[100, 270])
        details_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        
        # Wrap everything in a main container
        container_data = [
            [details_table, qr_img]
        ]
        container_table = Table(container_data, colWidths=[380, 160])
        container_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'CENTER'),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9fafb')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#d1d5db')),
            ('TOPPADDING', (0,0), (-1,-1), 15),
            ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ('LEFTPADDING', (0,0), (-1,-1), 15),
            ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ]))
        elements.append(container_table)
        elements.append(Spacer(1, 30))
        
        # Terms and conditions at the bottom
        terms_style = ParagraphStyle(
            'Terms',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            textColor=colors.HexColor('#9ca3af'),
            alignment=1 # Center
        )
        elements.append(Paragraph("This ticket is non-transferable. Please bring a valid photo ID along with this ticket for event entry.", terms_style))
        elements.append(Paragraph("Generated by AI Event Management Portal. All rights reserved.", terms_style))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
