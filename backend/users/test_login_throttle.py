import pytest
from django.core.cache import cache
from rest_framework.test import APIClient
from users.models import CustomUser

LOGIN_URL = "/api/v1/auth/token/"


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def victim(db):
    return CustomUser.objects.create_user(
        email="victim@example.com", password="correct-horse-battery-9", full_name="Victim"
    )


def _attempt(client, email, password, spoofed_ip):
    return client.post(
        LOGIN_URL,
        {"email": email, "password": password},
        format="json",
        HTTP_X_FORWARDED_FOR=spoofed_ip,
    )


@pytest.mark.django_db
class TestLoginAccountThrottle:
    def test_rotating_spoofed_ips_cannot_bypass_per_account_limit(self, victim, settings):
        settings.REST_FRAMEWORK = {
            **settings.REST_FRAMEWORK,
            "DEFAULT_THROTTLE_RATES": {**settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], "login_account": "5/hour"},
        }
        client = APIClient()

        statuses = [
            _attempt(client, "victim@example.com", f"guess-{i}", f"10.0.0.{i}").status_code
            for i in range(6)
        ]

        assert statuses[:5] == [401] * 5
        assert statuses[5] == 429

    def test_account_key_is_case_and_whitespace_insensitive(self, victim, settings):
        settings.REST_FRAMEWORK = {
            **settings.REST_FRAMEWORK,
            "DEFAULT_THROTTLE_RATES": {**settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], "login_account": "2/hour"},
        }
        client = APIClient()

        _attempt(client, "victim@example.com", "x1", "10.0.1.1")
        _attempt(client, " VICTIM@example.com ", "x2", "10.0.1.2")
        response = _attempt(client, "Victim@Example.com", "x3", "10.0.1.3")

        assert response.status_code == 429

    def test_other_accounts_are_not_affected(self, victim, settings):
        settings.REST_FRAMEWORK = {
            **settings.REST_FRAMEWORK,
            "DEFAULT_THROTTLE_RATES": {**settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], "login_account": "1/hour"},
        }
        CustomUser.objects.create_user(email="other@example.com", password="other-pass-77", full_name="Other")
        client = APIClient()

        _attempt(client, "victim@example.com", "bad", "10.0.2.1")
        response = _attempt(client, "other@example.com", "other-pass-77", "10.0.2.2")

        assert response.status_code == 200

    def test_default_rate_is_configured(self, settings):
        assert settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["login_account"] == "10/hour"
