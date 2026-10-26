"""
Lock demo accounts that still use a password published in the repository.

Idempotent and safe to run on every deploy: only demo accounts whose password
matches a leaked one are touched; their outstanding refresh tokens are revoked.
Usage: python manage.py lock_leaked_demo_passwords
"""

from django.core.management.base import BaseCommand

from core.demo_credentials import DEMO_ACCOUNT_EMAILS, LEAKED_DEMO_PASSWORDS


class Command(BaseCommand):
    help = 'Disable demo logins that still use a publicly leaked password'

    def handle(self, *args, **options):
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
        from users.models import CustomUser

        locked = 0
        for user in CustomUser.objects.filter(email__in=DEMO_ACCOUNT_EMAILS):
            if not any(user.check_password(p) for p in LEAKED_DEMO_PASSWORDS):
                continue
            user.set_unusable_password()
            user.save(update_fields=['password'])
            for token in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=token)
            locked += 1
            self.stdout.write(f'  Locked leaked demo login: {user.email}')

        self.stdout.write(self.style.SUCCESS(f'Leaked demo logins locked: {locked}'))
