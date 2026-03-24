#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/smoke_tests.sh https://tu-dominio.com
# Optional:
#   AUTH_EMAIL=demo@aktivar.app AUTH_PASSWORD=aktivar2024 bash scripts/smoke_tests.sh https://demo.aktivar.app

BASE_URL="${1:-}"
if [[ -z "$BASE_URL" ]]; then
  echo "Uso: bash scripts/smoke_tests.sh https://tu-dominio.com"
  exit 1
fi

AUTH_EMAIL="${AUTH_EMAIL:-}"
AUTH_PASSWORD="${AUTH_PASSWORD:-}"

failures=0

check_status() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$url" || true)

  if [[ "$code" == "$expected" ]]; then
    echo "✅ $name -> $code"
  else
    echo "❌ $name -> esperado $expected, recibido $code ($url)"
    failures=$((failures + 1))
  fi
}

echo "== Smoke test base: $BASE_URL =="
check_status "Frontend home" "$BASE_URL/" "200"
check_status "API root" "$BASE_URL/api/v1/" "200"
check_status "Schema JSON" "$BASE_URL/api/schema/" "200"
check_status "Swagger UI" "$BASE_URL/api/schema/swagger-ui/" "200"

if [[ -n "$AUTH_EMAIL" && -n "$AUTH_PASSWORD" ]]; then
  echo "== Probando login JWT =="
  LOGIN_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/v1/auth/login/" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$AUTH_EMAIL\",\"password\":\"$AUTH_PASSWORD\"}")

  if echo "$LOGIN_RESPONSE" | grep -q '"access"'; then
    echo "✅ Login JWT"
  else
    echo "❌ Login JWT (respuesta sin token access)"
    failures=$((failures + 1))
  fi
fi

echo
if [[ "$failures" -eq 0 ]]; then
  echo "✅ Smoke tests completados sin fallos"
  exit 0
else
  echo "❌ Smoke tests completados con $failures fallo(s)"
  exit 1
fi
