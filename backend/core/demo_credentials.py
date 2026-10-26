"""
Demo account credentials.

Demo passwords are never stored in the repository: seeds read them from the
DEMO_USER_PASSWORD environment variable, and without it demo accounts get an
unusable password (they exist for display but cannot log in).
"""

import os

DEMO_PASSWORD_ENV = 'DEMO_USER_PASSWORD'

# Passwords that were committed to this public repository. Any demo account
# still using one of them is considered compromised.
LEAKED_DEMO_PASSWORDS = ('demo1234', 'admin1234', 'aktivar2024')

# Accounts created by the load_demo_data and seed_demo commands.
DEMO_ACCOUNT_EMAILS = (
    'admin@aktivar.app',
    'catalina.reyes@gmail.com',
    'matias.gonzalez@gmail.com',
    'valentina.silva@gmail.com',
    'santiago.herrera@gmail.com',
    'camila.lopez@gmail.com',
    'andres.martinez@gmail.com',
    'demo@aktivar.app',
    'andres@aktivar.app',
    'camila@aktivar.app',
    'carlos@aktivar.app',
    'diego@aktivar.app',
    'lucia@aktivar.app',
    'pedro@aktivar.app',
    'valentina@aktivar.app',
)


def apply_demo_password(user):
    """Set the env-provided demo password, or make the login unusable."""
    password = os.environ.get(DEMO_PASSWORD_ENV)
    if password:
        user.set_password(password)
    else:
        user.set_unusable_password()
