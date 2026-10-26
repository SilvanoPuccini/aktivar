# Local dependency verification

Use a security-maintained Python 3.12 interpreter and Node 24.22.1. The
`.python-version` selects the Python minor, not an obsolete upstream micro;
install current vendor security updates before creating a fresh environment.
Never reuse a committed virtual environment or copy credentials into a checkout.

## Fresh installation

```sh
python3.12 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cd frontend
npm ci --ignore-scripts --min-release-age=3
npm run build
npm exec vitest run --maxWorkers=1
```

The lockfile retains exact npm artifacts and integrity hashes. Recheck the
complete installed graph after updates; a lock-only audit does not prove that
an existing `node_modules` directory matches the lockfile. Do not overlap a lock
refresh with installation. Install scripts remain disabled for verification.

## Backend server

The server is now stable Uvicorn rather than Daphne, removing the vulnerable
Twisted dependency without opting into a prerelease. Docker and Compose retain
`aktivar.asgi:application`, port 8000, access logging, and HTTP/WebSocket routing.
Forwarded-header trust stays disabled; Channels lifespan handling is disabled
because the existing application routes only HTTP and WebSocket scopes.

```sh
backend/.venv/bin/python -m uvicorn aktivar.asgi:application \
  --app-dir backend --host 127.0.0.1 --port 8000 \
  --access-log --no-proxy-headers --lifespan off
```

The existing Nginx upstream uses HTTP/1.1, including WebSocket upgrade headers;
client-facing HTTP/2 termination stays at Nginx. Direct Uvicorn HTTP/2 is not
provided. Application auth, consumers, payment integrations and Nginx policy
are unchanged. The unused `django-bleach` adapter was replaced by the direct
patched `bleach[css]` dependency already imported by application sanitization.

## Isolated checks

Do not run a database test against a configured application service. Dependency
verification used a new PostgreSQL 16/PostGIS cluster with a private Unix socket,
no TCP listener, isolated test database and automatic shutdown. Python network
connections were blocked; email, cache, channels, media and Celery used local
in-memory backends. No existing data or original virtual environment was changed.

The baseline backend suite passed 67 tests. The updated suite passed 70,
including dependency policy and real Unix-socket Uvicorn HTTP health and anonymous
WebSocket rejection checks. Fresh full-graph advisory checks are required before
activation; they describe known advisories at verification time, not immunity
from attacks. CI uses Node 24.22.1; dependency audit steps must fail on findings.

Known frontend test/lint failures must be compared with an isolated baseline,
not silently waived or repaired through an unrelated UI refactor. Dockerfile
changes are source-checked; no Docker daemon or deployment was executed.

## Verification outcome (2026-10-26)

The final installed Python graph had 86 packages and 86 OSV responses with no
known findings. The complete npm lock had 397 entries, 392 unique registry
name/version pairs and 392 OSV responses with no findings; all 345 installed
package versions matched the lock. The full installed npm audit also returned
zero findings. Optional and bundled lock entries were included, not discarded.

The production frontend build passed. Frontend tests passed 56 of 57 on both
baseline and candidate: the unchanged CategoryChip test expects
`bg-surface-container-highest` while the unchanged component uses
`bg-surface-container-high`. This existing failure is not waived or reported as
a clean suite. The React Hooks ESLint plugin stays at the baseline-compatible
7.0.1 release: 7.1.1 adds recommended rules unrelated to dependency security.
CI audit steps no longer ignore failures. Local proof is not remote CI execution.
