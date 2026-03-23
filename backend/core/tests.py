import pytest
from django.conf import settings


# ── Smoke test ───────────────────────────────────────────────────


def test_django_settings_configured():
    assert settings.configured


# ── sanitize_text ────────────────────────────────────────────────


def test_sanitize_text_strips_all_html():
    from core.sanitization import sanitize_text

    assert sanitize_text("<b>bold</b>") == "bold"


def test_sanitize_text_strips_script_tags():
    from core.sanitization import sanitize_text

    result = sanitize_text('<script>alert("xss")</script>Hello')
    assert "<script>" not in result
    assert "Hello" in result


def test_sanitize_text_returns_plain_text_as_is():
    from core.sanitization import sanitize_text

    assert sanitize_text("Hello world") == "Hello world"


def test_sanitize_text_handles_non_string():
    from core.sanitization import sanitize_text

    assert sanitize_text(123) == 123


# ── sanitize_rich_text ───────────────────────────────────────────


def test_sanitize_rich_text_allows_safe_tags():
    from core.sanitization import sanitize_rich_text

    html = "<b>bold</b> and <em>italic</em>"
    result = sanitize_rich_text(html)
    assert "<b>" in result
    assert "<em>" in result


def test_sanitize_rich_text_strips_script():
    from core.sanitization import sanitize_rich_text

    result = sanitize_rich_text('<script>alert("x")</script><b>ok</b>')
    assert "<script>" not in result
    assert "<b>ok</b>" in result


def test_sanitize_rich_text_allows_links():
    from core.sanitization import sanitize_rich_text

    html = '<a href="https://example.com" title="link">click</a>'
    result = sanitize_rich_text(html)
    assert "<a " in result
    assert "https://example.com" in result


def test_sanitize_rich_text_strips_disallowed_tags():
    from core.sanitization import sanitize_rich_text

    html = "<div>wrapper</div><b>bold</b>"
    result = sanitize_rich_text(html)
    assert "<div>" not in result
    assert "<b>bold</b>" in result
