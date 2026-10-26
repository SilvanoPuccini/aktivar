"""
Production settings for AKTIVAR project.
Inherits from base settings and applies security hardening.
"""

from .settings import *  # noqa: F401, F403

DEBUG = False

# Render puts three proxies in front of the app (measured via the xff_hops login
# log on both aktivar.online and aktivar.onrender.com). DRF then reads the client
# IP from the right of X-Forwarded-For, so spoofed left-hand entries are ignored.
REST_FRAMEWORK = {**REST_FRAMEWORK, "NUM_PROXIES": env.int("TRUSTED_PROXY_COUNT", default=3)}  # noqa: F405

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_CONTENT_TYPE_NOSNIFF = True
