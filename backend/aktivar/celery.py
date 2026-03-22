"""
Celery config for AKTIVAR project.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aktivar.settings")

app = Celery("aktivar")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
