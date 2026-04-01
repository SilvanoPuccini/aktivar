"""
Test settings for AKTIVAR.

These settings avoid external services and GIS system dependencies so CI/local
tests can run in isolated environments.
"""

from .settings import *  # noqa: F401, F403

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",
    }
}

# GDAL/PostGIS are not available in many CI containers
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "django.contrib.gis"]

# Keep tests fully in-memory and deterministic
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

# Speed up password hashing and keep auth flows testable
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Avoid network side effects in tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Smoke/local QA runs hit the seeded API repeatedly while traversing the app,
# so default DRF throttles create false 429 failures that do not reflect the
# product flow under test.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {},
}
