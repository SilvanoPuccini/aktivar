from unittest.mock import patch

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework_simplejwt.views import TokenObtainPairView
from users.models import CustomUser

LOGIN_URL = "/api/v1/auth/token/"
PASSWORD = "correct-horse-battery-9"


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def victim(db):
    return CustomUser.objects.create_user(email="victim@example.com", password=PASSWORD, full_name="Victim")


@pytest.fixture
def client():
    return APIClient()


def _attempt(client, email, password, spoofed_ip="10.0.0.1"):
    return client.post(
        LOGIN_URL,
        {"email": email, "password": password},
        format="json",
        HTTP_X_FORWARDED_FOR=spoofed_ip,
    )


@pytest.mark.django_db
class TestLoginAccountFailureLimit:
    def test_rotating_spoofed_ips_cannot_bypass_per_account_limit(self, victim, client, settings):
        settings.LOGIN_ACCOUNT_MAX_FAILURES = 5

        statuses = [_attempt(client, "victim@example.com", f"guess-{i}", f"10.0.0.{i}").status_code for i in range(6)]

        assert statuses[:5] == [401] * 5
        assert statuses[5] == 429

    def test_account_key_is_case_and_whitespace_insensitive(self, victim, client, settings):
        settings.LOGIN_ACCOUNT_MAX_FAILURES = 2

        _attempt(client, "victim@example.com", "x1")
        _attempt(client, " VICTIM@example.com ", "x2")

        assert _attempt(client, "Victim@Example.com", "x3").status_code == 429

    def test_successful_logins_do_not_count_toward_the_limit(self, victim, client, settings):
        settings.LOGIN_ACCOUNT_MAX_FAILURES = 2

        for _ in range(5):
            assert _attempt(client, "victim@example.com", PASSWORD).status_code == 200

    def test_successful_login_resets_failure_count(self, victim, client, settings):
        settings.LOGIN_ACCOUNT_MAX_FAILURES = 2

        _attempt(client, "victim@example.com", "bad-1")
        assert _attempt(client, "victim@example.com", PASSWORD).status_code == 200
        _attempt(client, "victim@example.com", "bad-2")

        assert _attempt(client, "victim@example.com", PASSWORD).status_code == 200

    def test_other_accounts_are_not_affected(self, victim, client, settings):
        settings.LOGIN_ACCOUNT_MAX_FAILURES = 1
        CustomUser.objects.create_user(email="other@example.com", password="other-pass-77", full_name="Other")

        _attempt(client, "victim@example.com", "bad")

        assert _attempt(client, "other@example.com", "other-pass-77").status_code == 200

    def test_attempt_is_reserved_before_authenticating(self, victim, client, settings):
        # Concurrent requests must not all pass a stale read of the counter.
        settings.LOGIN_ACCOUNT_MAX_FAILURES = 3
        seen = []
        original = TokenObtainPairView.post

        def spy(view, request, *args, **kwargs):
            seen.append(cache.get("login-failures:victim@example.com"))
            return original(view, request, *args, **kwargs)

        with patch.object(TokenObtainPairView, "post", spy):
            _attempt(client, "victim@example.com", "bad")

        assert seen == [1]

    def test_lock_lasts_full_window_from_reaching_the_limit(self, victim, client, settings):
        settings.LOGIN_ACCOUNT_MAX_FAILURES = 2
        settings.LOGIN_ACCOUNT_LOCK_SECONDS = 100
        now = [1_000_000.0]

        with patch("django.core.cache.backends.locmem.time.time", lambda: now[0]):
            _attempt(client, "victim@example.com", "bad-1")
            now[0] += 90
            _attempt(client, "victim@example.com", "bad-2")
            now[0] += 60  # 150s after the first failure, 60s after hitting the limit

            assert _attempt(client, "victim@example.com", PASSWORD).status_code == 429

    def test_defaults_bound_the_lockout_window(self, settings):
        assert settings.LOGIN_ACCOUNT_MAX_FAILURES == 10
        assert settings.LOGIN_ACCOUNT_LOCK_SECONDS == 15 * 60
