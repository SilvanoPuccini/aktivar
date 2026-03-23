"""
Input sanitization utilities for user-facing text fields.

Uses bleach to strip dangerous HTML/JS from text inputs at the serializer
level, preventing stored XSS attacks.
"""

import logging

logger = logging.getLogger(__name__)

try:
    import bleach
    HAS_BLEACH = True
except ImportError:
    HAS_BLEACH = False
    logger.warning('bleach not installed — input sanitization disabled')


def sanitize_text(value: str) -> str:
    """Strip all HTML tags from a text string."""
    if not HAS_BLEACH or not isinstance(value, str):
        return value
    return bleach.clean(value, tags=[], attributes={}, strip=True).strip()


def sanitize_rich_text(value: str) -> str:
    """Allow a safe subset of HTML tags (for rich descriptions)."""
    if not HAS_BLEACH or not isinstance(value, str):
        return value
    from django.conf import settings
    allowed_tags = getattr(settings, 'BLEACH_ALLOWED_TAGS', [])
    allowed_attrs = getattr(settings, 'BLEACH_ALLOWED_ATTRIBUTES', {})
    return bleach.clean(
        value,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True,
    ).strip()


class SanitizeMixin:
    """
    DRF serializer mixin that sanitizes text fields on validate().

    Usage:
        class MySerializer(SanitizeMixin, serializers.ModelSerializer):
            sanitize_fields = ['title', 'description', 'comment']
            # Fields in rich_text_fields get allowed HTML subset;
            # everything else is fully stripped.
            rich_text_fields = ['description']
    """

    sanitize_fields: list[str] = []
    rich_text_fields: list[str] = []

    def validate(self, attrs):
        attrs = super().validate(attrs)
        for field_name in self.sanitize_fields:
            if field_name in attrs and isinstance(attrs[field_name], str):
                if field_name in self.rich_text_fields:
                    attrs[field_name] = sanitize_rich_text(attrs[field_name])
                else:
                    attrs[field_name] = sanitize_text(attrs[field_name])
        return attrs
