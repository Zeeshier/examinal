import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def _send(to_email: str, subject: str, body: str) -> bool:
    """Low-level SMTP send. Returns True on success."""
    if not settings.MAIL_PASSWORD:
        print(f"[Email] MAIL_PASSWORD not set. Would send to {to_email}: {subject}")
        return False
    try:
        msg = MIMEMultipart()
        msg["From"] = f"Examinal <{settings.MAIL_FROM}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        if settings.MAIL_USE_TLS:
            server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
        server.quit()
        print(f"[Email] Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[Email] Transmission failure: {e}")
        return False


def send_reply_email(to_email: str, original_subject: str, reply_content: str) -> bool:
    """Sends a professional reply via Gmail SMTP."""
    body = f"""Hello,

This is an official response from the Examinal Assessment Portal regarding your inquiry.

--------------------------------------------------------------------------------
REPLY CONTENT:
{reply_content}
--------------------------------------------------------------------------------

If you have further questions, please maintain this thread.

Best regards,
Examinal Administration
{settings.MAIL_FROM}
"""
    return _send(to_email, f"Response: {original_subject}", body)


def send_password_reset_email(to_email: str, reset_token: str, username: str) -> bool:
    """Sends a password-reset link. Token is raw (unhashed) — embed in URL."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    body = f"""Hello {username},

We received a request to reset your Examinal account password.

Click the link below to set a new password (valid for 30 minutes):
{reset_url}

If you did not request a password reset, please ignore this email.
Your password will remain unchanged.

Best regards,
Examinal Security Team
{settings.MAIL_FROM}
"""
    return _send(to_email, "Reset Your Examinal Password", body)
