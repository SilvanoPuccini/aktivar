import logging

import requests
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


# ── Resend Email Helpers ──────────────────────────────────────────

def _send_resend_email(to_email, subject, html_body):
    """Send an email via Resend API. Returns True on success."""
    api_key = getattr(settings, 'RESEND_API_KEY', '')
    from_email = getattr(settings, 'RESEND_FROM_EMAIL', 'Aktivar <noreply@aktivar.app>')

    if not api_key:
        logger.warning('RESEND_API_KEY not configured, email not sent to=%s', to_email)
        return False

    try:
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'from': from_email,
                'to': [to_email],
                'subject': subject,
                'html': html_body,
            },
            timeout=10,
        )
        response.raise_for_status()
        logger.info('Resend email sent to=%s subject=%s', to_email, subject)
        return True
    except requests.RequestException as e:
        logger.error('Resend email failed to=%s error=%s', to_email, str(e))
        return False


# ── OneSignal Push Helper ─────────────────────────────────────────

def _send_onesignal_push(user_id, title, body, data=None):
    """Send push notification via OneSignal REST API."""
    app_id = getattr(settings, 'ONESIGNAL_APP_ID', '')
    api_key = getattr(settings, 'ONESIGNAL_REST_API_KEY', '')

    if not app_id or not api_key:
        logger.warning('OneSignal not configured, push not sent for user=%s', user_id)
        return False

    try:
        response = requests.post(
            'https://onesignal.com/api/v1/notifications',
            headers={
                'Authorization': f'Basic {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'app_id': app_id,
                'include_external_user_ids': [str(user_id)],
                'headings': {'en': title},
                'contents': {'en': body},
                'data': data or {},
            },
            timeout=10,
        )
        response.raise_for_status()
        logger.info('OneSignal push sent user=%s title=%s', user_id, title)
        return True
    except requests.RequestException as e:
        logger.error('OneSignal push failed user=%s error=%s', user_id, str(e))
        return False


# ── Twilio SMS Helper ─────────────────────────────────────────────

def _send_twilio_sms(to_phone, message):
    """Send SMS via Twilio API."""
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_phone = getattr(settings, 'TWILIO_PHONE_NUMBER', '')

    if not account_sid or not auth_token:
        logger.warning('Twilio not configured, SMS not sent to=%s', to_phone)
        return False

    try:
        response = requests.post(
            f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json',
            auth=(account_sid, auth_token),
            data={
                'From': from_phone,
                'To': to_phone,
                'Body': message,
            },
            timeout=10,
        )
        response.raise_for_status()
        logger.info('Twilio SMS sent to=%s', to_phone)
        return True
    except requests.RequestException as e:
        logger.error('Twilio SMS failed to=%s error=%s', to_phone, str(e))
        return False


# ── Core Notification Tasks ───────────────────────────────────────

@shared_task
def send_notification(user_id, notification_type, title, body, data=None):
    """
    Create an in-app notification and trigger email/push delivery.
    """
    from .models import Notification

    notification = Notification.objects.create(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        body=body,
        data=data or {},
    )
    logger.info(
        'Notification created: id=%d type=%s user=%d',
        notification.id,
        notification_type,
        user_id,
    )

    # Trigger push and email in parallel
    send_push_notification.delay(notification.id)
    send_email_notification.delay(notification.id)

    return notification.id


@shared_task
def send_email_notification(notification_id):
    """Send an email notification via Resend."""
    from .models import Notification

    try:
        notification = Notification.objects.select_related('user').get(id=notification_id)
        _send_resend_email(
            to_email=notification.user.email,
            subject=notification.title,
            html_body=f"""
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #11140f; color: #e1e3da; padding: 32px;">
                <h1 style="font-family: 'Epilogue', sans-serif; color: #ffc56c; font-size: 24px;">{notification.title}</h1>
                <p style="font-size: 16px; line-height: 1.6; margin-top: 16px;">{notification.body}</p>
                <hr style="border: none; border-top: 1px solid #333630; margin: 24px 0;" />
                <p style="font-size: 12px; color: #9f8e79;">Aktivar — Tu comunidad outdoor</p>
            </div>
            """,
        )
    except Notification.DoesNotExist:
        logger.warning('Notification %d not found for email delivery', notification_id)


@shared_task
def send_push_notification(notification_id):
    """Send a push notification via OneSignal."""
    from .models import Notification

    try:
        notification = Notification.objects.select_related('user').get(id=notification_id)
        _send_onesignal_push(
            user_id=notification.user_id,
            title=notification.title,
            body=notification.body,
            data=notification.data,
        )
    except Notification.DoesNotExist:
        logger.warning('Notification %d not found for push delivery', notification_id)


# ── Verification Tasks ────────────────────────────────────────────

@shared_task
def send_verification_email(user_id, email, verify_url):
    """Send email verification link via Resend."""
    _send_resend_email(
        to_email=email,
        subject='Verifica tu email — Aktivar',
        html_body=f"""
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #11140f; color: #e1e3da; padding: 32px;">
            <h1 style="font-family: 'Epilogue', sans-serif; color: #ffc56c; font-size: 28px;">Verifica tu email</h1>
            <p style="font-size: 16px; line-height: 1.6; margin-top: 16px;">
                Haz clic en el boton para verificar tu cuenta en Aktivar.
            </p>
            <a href="{verify_url}"
               style="display: inline-block; margin-top: 24px; padding: 14px 32px;
                      background: linear-gradient(135deg, #ffc56c, #f0a500);
                      color: #11140f; font-weight: 700; text-decoration: none;
                      border-radius: 9999px; font-size: 16px;">
                Verificar email
            </a>
            <p style="font-size: 12px; color: #9f8e79; margin-top: 24px;">
                Este enlace expira en 24 horas. Si no solicitaste esta verificacion, ignora este email.
            </p>
        </div>
        """,
    )


@shared_task
def send_phone_otp(user_id, phone, otp):
    """Send OTP code via Twilio SMS."""
    _send_twilio_sms(
        to_phone=phone,
        message=f'Tu codigo de verificacion Aktivar es: {otp}. Expira en 10 minutos.',
    )


# ── Transactional Email Templates ─────────────────────────────────

@shared_task
def send_activity_confirmation_email(user_id, activity_title, activity_date):
    """Send activity join confirmation email."""
    from users.models import CustomUser

    try:
        user = CustomUser.objects.get(id=user_id)
        _send_resend_email(
            to_email=user.email,
            subject=f'Confirmado: {activity_title} — Aktivar',
            html_body=f"""
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #11140f; color: #e1e3da; padding: 32px;">
                <h1 style="font-family: 'Epilogue', sans-serif; color: #7bda96; font-size: 24px;">Lugar confirmado</h1>
                <p style="font-size: 16px; line-height: 1.6; margin-top: 16px;">
                    Tu lugar en <strong style="color: #ffc56c;">{activity_title}</strong> ha sido confirmado.
                </p>
                <p style="font-size: 14px; color: #d6c4ac; margin-top: 8px;">
                    Fecha: {activity_date}
                </p>
                <hr style="border: none; border-top: 1px solid #333630; margin: 24px 0;" />
                <p style="font-size: 12px; color: #9f8e79;">Aktivar — Tu comunidad outdoor</p>
            </div>
            """,
        )
    except CustomUser.DoesNotExist:
        logger.warning('User %d not found for activity confirmation email', user_id)


@shared_task
def send_activity_reminder_email(user_id, activity_title, activity_date, hours_before=24):
    """Send activity reminder email."""
    from users.models import CustomUser

    try:
        user = CustomUser.objects.get(id=user_id)
        _send_resend_email(
            to_email=user.email,
            subject=f'Recordatorio: {activity_title} en {hours_before}h — Aktivar',
            html_body=f"""
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #11140f; color: #e1e3da; padding: 32px;">
                <h1 style="font-family: 'Epilogue', sans-serif; color: #ffc56c; font-size: 24px;">Tu actividad es pronto</h1>
                <p style="font-size: 16px; line-height: 1.6; margin-top: 16px;">
                    <strong style="color: #ffc56c;">{activity_title}</strong> comienza en {hours_before} horas.
                </p>
                <p style="font-size: 14px; color: #d6c4ac; margin-top: 8px;">
                    Fecha: {activity_date}
                </p>
                <hr style="border: none; border-top: 1px solid #333630; margin: 24px 0;" />
                <p style="font-size: 12px; color: #9f8e79;">Aktivar — Tu comunidad outdoor</p>
            </div>
            """,
        )
    except CustomUser.DoesNotExist:
        logger.warning('User %d not found for reminder email', user_id)


@shared_task
def send_review_request_email(user_id, activity_title):
    """Send review request email after activity completion."""
    from users.models import CustomUser

    try:
        user = CustomUser.objects.get(id=user_id)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        _send_resend_email(
            to_email=user.email,
            subject=f'Como estuvo {activity_title}? — Aktivar',
            html_body=f"""
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #11140f; color: #e1e3da; padding: 32px;">
                <h1 style="font-family: 'Epilogue', sans-serif; color: #ffc56c; font-size: 24px;">Deja tu review</h1>
                <p style="font-size: 16px; line-height: 1.6; margin-top: 16px;">
                    Como fue tu experiencia en <strong style="color: #ffc56c;">{activity_title}</strong>?
                    Tu opinion ayuda a la comunidad.
                </p>
                <a href="{frontend_url}"
                   style="display: inline-block; margin-top: 24px; padding: 14px 32px;
                          background: linear-gradient(135deg, #ffc56c, #f0a500);
                          color: #11140f; font-weight: 700; text-decoration: none;
                          border-radius: 9999px; font-size: 16px;">
                    Dejar review
                </a>
                <hr style="border: none; border-top: 1px solid #333630; margin: 24px 0;" />
                <p style="font-size: 12px; color: #9f8e79;">Aktivar — Tu comunidad outdoor</p>
            </div>
            """,
        )
    except CustomUser.DoesNotExist:
        logger.warning('User %d not found for review request email', user_id)
