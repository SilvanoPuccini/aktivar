#!/usr/bin/env bash
set -euo pipefail

# Uso:
#   bash scripts/vps_connection_check.sh https://aktivar.online
# Opcional:
#   RUN_REGISTER_PROBE=1 bash scripts/vps_connection_check.sh https://aktivar.online
#   AUTH_EMAIL=mail@demo.com AUTH_PASSWORD=secret bash scripts/vps_connection_check.sh https://aktivar.online

BASE_URL="${1:-}"
if [[ -z "$BASE_URL" ]]; then
  echo "Uso: bash scripts/vps_connection_check.sh https://tu-dominio.com"
  exit 1
fi

RUN_REGISTER_PROBE="${RUN_REGISTER_PROBE:-1}"
AUTH_EMAIL="${AUTH_EMAIL:-}"
AUTH_PASSWORD="${AUTH_PASSWORD:-}"

failures=0
host="$(echo "$BASE_URL" | sed -E 's#https?://##' | cut -d/ -f1)"

ok() { echo "✅ $1"; }
fail() {
  echo "❌ $1"
  failures=$((failures + 1))
}

check_status() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "$url" || true)"
  if [[ "$code" == "$expected" ]]; then
    ok "$name -> $code"
  else
    fail "$name -> esperado $expected, recibido $code ($url)"
  fi
}

echo "== Verificación de conexión para $BASE_URL =="

if command -v getent >/dev/null 2>&1; then
  if getent hosts "$host" >/dev/null 2>&1; then
    ip="$(getent hosts "$host" | awk '{print $1}' | head -n1)"
    ok "DNS resuelve $host -> $ip"
  else
    fail "DNS no resolvió $host"
  fi
else
  echo "⚠️ getent no disponible, se omite chequeo DNS"
fi

if curl -sS --head --max-time 12 "$BASE_URL/" >/dev/null; then
  ok "Conexión HTTPS/HTTP al dominio"
else
  fail "No se pudo conectar al dominio"
fi

check_status "Frontend home" "$BASE_URL/" "200"
check_status "API root" "$BASE_URL/api/v1/" "200"
check_status "Schema JSON" "$BASE_URL/api/schema/" "200"
check_status "Swagger UI" "$BASE_URL/api/schema/swagger-ui/" "200"

if [[ "$RUN_REGISTER_PROBE" == "1" ]]; then
  probe_email="probe.$(date +%s)@example.com"
  payload="{\"email\":\"$probe_email\",\"password\":\"ProbePass123!\",\"full_name\":\"Probe User\"}"
  response_file="$(mktemp)"

  code="$(curl -sS -o "$response_file" -w "%{http_code}" \
    -X POST "$BASE_URL/api/v1/users/register/" \
    -H "Content-Type: application/json" \
    -d "$payload" || true)"

  if [[ "$code" == "201" ]]; then
    ok "Registro probe -> 201"
  elif [[ "$code" == "400" || "$code" == "429" ]]; then
    ok "Registro probe manejado por API -> $code"
  else
    body="$(cat "$response_file" | tr -d '\n' | cut -c1-240)"
    fail "Registro probe devolvió $code. Body: $body"
  fi
  rm -f "$response_file"
fi

if [[ -n "$AUTH_EMAIL" && -n "$AUTH_PASSWORD" ]]; then
  response_file="$(mktemp)"
  code="$(curl -sS -o "$response_file" -w "%{http_code}" \
    -X POST "$BASE_URL/api/v1/auth/token/" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$AUTH_EMAIL\",\"password\":\"$AUTH_PASSWORD\"}" || true)"

  if [[ "$code" == "200" ]] && grep -q '"access"' "$response_file"; then
    ok "Login JWT -> 200 con access"
  else
    body="$(cat "$response_file" | tr -d '\n' | cut -c1-240)"
    fail "Login JWT devolvió $code. Body: $body"
  fi
  rm -f "$response_file"
fi

echo
if [[ "$failures" -eq 0 ]]; then
  ok "Control total de conexión finalizado sin fallos"
  exit 0
fi

fail "Control total de conexión terminó con $failures fallo(s)"
echo "Siguiente paso recomendado: revisar docs/vps-auth-debug-checklist.md"
exit 1
