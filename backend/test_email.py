import sys
import os

# Add the current directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.email_service import send_email

if __name__ == "__main__":
    print("Testing SMTP email delivery...")
    success = send_email(
        "soubhiksadhuri12@gmail.com",
        "UPCRM Test Email",
        "SMTP integration successful."
    )
    if success:
        print("Test script executed successfully!")
    else:
        print("Test script failed to send email.")
