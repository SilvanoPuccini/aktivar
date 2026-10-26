"""Pin the maintained dependency cohort and container build runtime."""

from pathlib import Path

from packaging.requirements import Requirement

ROOT = Path(__file__).resolve().parents[2]


def test_backend_security_floors():
    requirements = {
        requirement.name.lower(): requirement
        for line in (ROOT / "backend/requirements.txt").read_text().splitlines()
        if line.strip() and not line.startswith("#")
        for requirement in [Requirement(line)]
    }
    floors = {
        "django": "5.2.18",
        "djangorestframework": "3.18.2",
        "pillow": "13.0.0",
        "bleach": "6.4.0",
        "black": "26.10.1",
        "pytest": "9.0.3",
    }
    for name, version in floors.items():
        assert f">={version}" in str(requirements[name].specifier), name
    assert "django-bleach" not in requirements
    assert "<5.3" in str(requirements["django"].specifier)


def test_node_container_builds_use_security_release():
    for path in ("frontend/Dockerfile", "nginx/Dockerfile"):
        assert "FROM node:24.22.1-alpine AS " in (ROOT / path).read_text()


def test_stable_asgi_server_preserves_http_and_anonymous_websocket_rejection(tmp_path):
    """Exercise real HTTP/WS handshakes without opening a TCP listener."""
    import base64
    import os
    import socket
    import subprocess
    import sys
    import time

    socket_path = tmp_path / "asgi.sock"
    with (tmp_path / "server.log").open("w+") as log:
        process = subprocess.Popen(
            [
                sys.executable, "-m", "uvicorn", "aktivar.asgi:application",
                "--uds", str(socket_path), "--access-log",
                "--no-proxy-headers", "--lifespan", "off",
            ],
            cwd=ROOT / "backend", env=os.environ.copy(), stdout=log, stderr=log,
        )
        try:
            deadline = time.monotonic() + 20
            while not socket_path.exists():
                assert process.poll() is None, "ASGI server exited during startup"
                assert time.monotonic() < deadline, "ASGI startup timed out"
                time.sleep(0.05)

            def exchange(request):
                with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
                    client.settimeout(10)
                    client.connect(str(socket_path))
                    client.sendall(request.encode("ascii"))
                    response = b""
                    while True:
                        data = client.recv(4096)
                        if not data:
                            return response
                        response += data

            response = exchange(
                "GET /api/v1/health/ HTTP/1.1\r\nHost: localhost\r\n"
                "Connection: close\r\n\r\n"
            )
            assert response.startswith(b"HTTP/1.1 200 "), response
            assert b'"status": "ok"' in response, response
            key = base64.b64encode(b"0123456789abcdef").decode("ascii")
            response = exchange(
                "GET /ws/chat/activity/1/ HTTP/1.1\r\nHost: localhost\r\n"
                "Upgrade: websocket\r\nConnection: Upgrade\r\n"
                "Sec-WebSocket-Version: 13\r\n"
                f"Sec-WebSocket-Key: {key}\r\n\r\n"
            )
            assert response.startswith(b"HTTP/1.1 403 "), response
            assert b"101 Switching Protocols" not in response
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
