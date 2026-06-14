import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))

def send_email(receiver: str, subject: str, body: str) -> bool:
    """
    Sends an email using SMTP_SSL.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("[Email Service] SMTP credentials not set in .env. Skipping email dispatch.")
        return False

    print(f"[Email Service] Preparing to send email to {receiver}...")
    
    # Create message container
    msg = MIMEMultipart()
    msg['From'] = SMTP_EMAIL
    msg['To'] = receiver
    msg['Subject'] = subject
    
    # Attach body
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        # Connect to Gmail SMTP server using SSL
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10.0) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, receiver, msg.as_string())
        print(f"[Email Service] Email successfully sent to {receiver}!")
        return True
    except Exception as e:
        print(f"[Email Service] Failed to send email: {e}")
        return False
