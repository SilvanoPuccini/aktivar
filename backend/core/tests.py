from django.test import TestCase


class SmokeTest(TestCase):
    """Basic smoke test to verify Django setup."""

    def test_django_settings_configured(self):
        from django.conf import settings
        self.assertTrue(settings.configured)
