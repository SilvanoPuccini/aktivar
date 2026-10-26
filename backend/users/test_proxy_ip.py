import importlib

import pytest
from rest_framework.test import APIRequestFactory
from rest_framework.throttling import AnonRateThrottle

# Render's measured chain: the three proxy hops append client, edge and balancer
# addresses, so the real client is the third entry from the right.
RENDER_CHAIN = "203.0.113.50, 172.70.1.1, 10.0.0.9"


def _ident(xff, settings):
    request = APIRequestFactory().post("/api/v1/auth/token/", HTTP_X_FORWARDED_FOR=xff, REMOTE_ADDR="10.0.0.9")
    return AnonRateThrottle().get_ident(request)


@pytest.fixture
def render_proxies(settings):
    settings.REST_FRAMEWORK = {**settings.REST_FRAMEWORK, "NUM_PROXIES": 3}
    return settings


def test_real_client_ip_is_taken_from_render_chain(render_proxies):
    assert _ident(RENDER_CHAIN, render_proxies) == "203.0.113.50"


@pytest.mark.parametrize("spoofed", ["1.1.1.1", "1.1.1.1, 2.2.2.2", "9.9.9.9, 8.8.8.8, 7.7.7.7"])
def test_spoofed_prefix_cannot_change_the_identity(render_proxies, spoofed):
    assert _ident(f"{spoofed}, {RENDER_CHAIN}", render_proxies) == "203.0.113.50"


def test_production_settings_trust_three_proxies_by_default(monkeypatch):
    monkeypatch.delenv("TRUSTED_PROXY_COUNT", raising=False)
    prod = importlib.reload(importlib.import_module("aktivar.settings_prod"))

    assert prod.REST_FRAMEWORK["NUM_PROXIES"] == 3


def test_production_proxy_count_is_overridable(monkeypatch):
    monkeypatch.setenv("TRUSTED_PROXY_COUNT", "1")
    prod = importlib.reload(importlib.import_module("aktivar.settings_prod"))

    assert prod.REST_FRAMEWORK["NUM_PROXIES"] == 1
