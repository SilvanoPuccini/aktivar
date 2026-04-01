"""
Django settings for AKTIVAR project.
"""

import os
from datetime import timedelta
from pathlib import Path

import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# django-environ
env = environ.Env(
    DEBUG=(bool, True),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173"]),
    SECRET_KEY=(str, "django-insecure-change-me-in-production"),
    CLOUDINARY_URL=(str, ""),
    DB_ENGINE=(str, "django.contrib.gis.db.backends.postgis"),
)

_env_file = os.path.join(BASE_DIR, ".env")
if os.path.isfile(_env_file):
    environ.Env.read_env(_env_file)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env("DEBUG")

ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Application definition
INSTALLED_APPS = [
    # Daphne must be before django.contrib.staticfiles
    "daphne",
    # Django defaults
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "channels",
    "whitenoise.runserver_nostatic",
    "django_redis",
    "import_export",
    # Project apps
    "users",
    "activities",
    "transport",
    "chat",
    "reviews",
    "payments",
    "notifications",
    "core",
    "ecosystem",
]

AUTH_USER_MODEL = "users.CustomUser"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "aktivar.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "aktivar.wsgi.application"
ASGI_APPLICATION = "aktivar.asgi.application"

# Database
_db_engine = env("DB_ENGINE", default="django.contrib.gis.db.backends.postgis")
_database_url = env("DATABASE_URL", default="")
DATABASES = {
    "default": {
        "ENGINE": _db_engine,
        "NAME": env("DB_NAME", default="aktivar_db"),
        "USER": env("DB_USER", default="aktivar"),
        "PASSWORD": env("DB_PASSWORD", default="aktivar_dev_2025"),
        "HOST": env("DB_HOST", default="localhost"),
        "PORT": env("DB_PORT", default="5432"),
    }
}

# If DATABASE_URL is provided (Dokploy/12-factor style), prefer it.
if _database_url:
    DATABASES["default"] = env.db("DATABASE_URL")

# When using SQLite (CI), remove GIS from INSTALLED_APPS since GDAL is not available
if "sqlite" in _db_engine:
    DATABASES["default"] = {
        "ENGINE": _db_engine,
        "NAME": BASE_DIR / env("DB_NAME", default="db.sqlite3"),
    }
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "django.contrib.gis"]

# Caches
_redis_url = env("REDIS_URL", default="redis://127.0.0.1:6379/0")
_use_redis_cache = env.bool("USE_REDIS_CACHE", default=True)

if _use_redis_cache:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": env("REDIS_CACHE_URL", default=_redis_url),
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

# Channel Layers
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [env("REDIS_CHANNEL_URL", default=_redis_url)],
        },
    },
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Password hashers - Argon2 first
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]

# Internationalization
LANGUAGE_CODE = "es-la"
TIME_ZONE = "America/Santiago"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# Media files
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Cloudinary (optional)
CLOUDINARY_URL = env("CLOUDINARY_URL")
if CLOUDINARY_URL:
    STORAGES["default"] = {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"}

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "core.pagination.CreatedAtCursorPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day",
        "auth": "30/hour",
        "otp": "3/hour",
        "join": "10/hour",
    },
}

# Simple JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_COOKIE": "refresh_token",
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SECURE": not DEBUG,
    "AUTH_COOKIE_SAMESITE": "Lax",
}

# CORS
_cors_origins = env("CORS_ALLOWED_ORIGINS")
if _cors_origins == ["*"] or _cors_origins == "*":
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = []
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = _cors_origins

# CSRF trusted origins (needed for admin and API from external IPs/domains)
_csrf_raw = env("CSRF_TRUSTED_ORIGINS", default="")
if _csrf_raw and _csrf_raw != "*":
    if isinstance(_csrf_raw, str):
        CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_raw.split(",") if o.strip()]
    else:
        CSRF_TRUSTED_ORIGINS = _csrf_raw
elif CORS_ALLOWED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
else:
    CSRF_TRUSTED_ORIGINS = []

# Security flags (default safe for HTTP; set True in .env when you have SSL)
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=not DEBUG)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=not DEBUG)

# Celery
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=_redis_url)
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default=_redis_url)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

# Resend (transactional emails)
RESEND_API_KEY = env("RESEND_API_KEY", default="")
RESEND_FROM_EMAIL = env("RESEND_FROM_EMAIL", default="Aktivar <noreply@aktivar.app>")

# Twilio (phone OTP)
TWILIO_ACCOUNT_SID = env("TWILIO_ACCOUNT_SID", default="")
TWILIO_AUTH_TOKEN = env("TWILIO_AUTH_TOKEN", default="")
TWILIO_PHONE_NUMBER = env("TWILIO_PHONE_NUMBER", default="")

# OneSignal (push notifications)
ONESIGNAL_APP_ID = env("ONESIGNAL_APP_ID", default="")
ONESIGNAL_REST_API_KEY = env("ONESIGNAL_REST_API_KEY", default="")

# OpenAI (content moderation)
OPENAI_API_KEY = env("OPENAI_API_KEY", default="")

# Frontend URL (for email links)
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

# Stripe
STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", default="")
STRIPE_PUBLISHABLE_KEY = env("STRIPE_PUBLISHABLE_KEY", default="")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", default="")
STRIPE_PRICE_ORGANIZER = env("STRIPE_PRICE_ORGANIZER", default="")
STRIPE_PRICE_EXPLORER = env("STRIPE_PRICE_EXPLORER", default="")

# ── Input Sanitization (django-bleach) ──────────────────────────────
BLEACH_ALLOWED_TAGS = ["b", "i", "u", "em", "strong", "a", "br", "p"]
BLEACH_ALLOWED_ATTRIBUTES = {"a": ["href", "title", "target"]}
BLEACH_ALLOWED_PROTOCOLS = ["http", "https"]
BLEACH_STRIP_TAGS = True
BLEACH_STRIP_COMMENTS = True

# ── Sentry Monitoring ──────────────────────────────────────────────
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.1 if not DEBUG else 1.0,
        profiles_sample_rate=0.1 if not DEBUG else 1.0,
        send_default_pii=False,
        environment="development" if DEBUG else "production",
    )

# drf-spectacular
SPECTACULAR_SETTINGS = {
    "TITLE": "AKTIVAR API",
    "DESCRIPTION": "API para la plataforma AKTIVAR de actividades y transporte compartido.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}
