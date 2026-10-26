import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import CustomUser

# Passwords that were published in this public repository and must never
# authenticate again, whatever environment the seed commands ran in.
LEAKED_PASSWORDS = ("demo1234", "admin1234", "aktivar2024")


def _make_user(email, password):
    return CustomUser.objects.create_user(email=email, password=password, full_name="Demo")


@pytest.mark.django_db
class TestLockLeakedDemoPasswords:
    @pytest.mark.parametrize("password", LEAKED_PASSWORDS)
    def test_locks_demo_account_with_leaked_password(self, password):
        user = _make_user("catalina.reyes@gmail.com", password)

        call_command("lock_leaked_demo_passwords")

        user.refresh_from_db()
        assert not user.has_usable_password()
        assert not user.check_password(password)

    def test_keeps_demo_account_whose_password_was_changed(self):
        user = _make_user("demo@aktivar.app", "a-new-private-password-42")

        call_command("lock_leaked_demo_passwords")

        user.refresh_from_db()
        assert user.check_password("a-new-private-password-42")

    def test_never_touches_non_demo_accounts(self):
        user = _make_user("real.person@example.com", "demo1234")

        call_command("lock_leaked_demo_passwords")

        user.refresh_from_db()
        assert user.check_password("demo1234")

    def test_revokes_outstanding_refresh_tokens_of_locked_accounts(self):
        user = _make_user("admin@aktivar.app", "admin1234")
        token = RefreshToken.for_user(user)

        call_command("lock_leaked_demo_passwords")

        assert BlacklistedToken.objects.filter(token__jti=token["jti"]).exists()

    def test_is_idempotent(self):
        _make_user("valentina@aktivar.app", "aktivar2024")

        call_command("lock_leaked_demo_passwords")
        call_command("lock_leaked_demo_passwords")

        assert not CustomUser.objects.get(email="valentina@aktivar.app").has_usable_password()


@pytest.mark.django_db
class TestDemoSeedsDoNotPublishPasswords:
    def test_load_demo_data_refuses_to_run_in_production(self, settings):
        settings.DEBUG = False

        with pytest.raises(CommandError):
            call_command("load_demo_data")

        assert not CustomUser.objects.exists()

    def test_load_demo_data_without_env_password_creates_unusable_logins(self, settings, monkeypatch):
        settings.DEBUG = True
        monkeypatch.delenv("DEMO_USER_PASSWORD", raising=False)

        call_command("load_demo_data")

        users = CustomUser.objects.all()
        assert users.exists()
        assert not users.filter(is_superuser=True).exists()
        for user in users:
            assert not user.has_usable_password()

    def test_load_demo_data_uses_env_password(self, settings, monkeypatch):
        settings.DEBUG = True
        monkeypatch.setenv("DEMO_USER_PASSWORD", "env-only-demo-secret-9")

        call_command("load_demo_data")

        user = CustomUser.objects.get(email="catalina.reyes@gmail.com")
        assert user.check_password("env-only-demo-secret-9")

    def test_seed_demo_never_sets_a_leaked_password(self, monkeypatch):
        monkeypatch.delenv("DEMO_USER_PASSWORD", raising=False)

        call_command("seed_demo")

        for user in CustomUser.objects.all():
            assert not any(user.check_password(p) for p in LEAKED_PASSWORDS)
