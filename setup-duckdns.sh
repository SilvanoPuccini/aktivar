#!/bin/bash
# =============================================================================
# Aktivar — Setup DuckDNS Free Subdomain
# Gives you a free domain like: aktivar.duckdns.org
#
# Usage: bash setup-duckdns.sh <subdomain> <token>
#
# Steps:
#   1. Go to https://www.duckdns.org and login with Google/GitHub
#   2. Create a subdomain (e.g., "aktivar")
#   3. Copy your token from the DuckDNS dashboard
#   4. Run: bash setup-duckdns.sh aktivar your-token-here
# =============================================================================

set -e

SUBDOMAIN="${1}"
TOKEN="${2}"

if [ -z "$SUBDOMAIN" ] || [ -z "$TOKEN" ]; then
    echo "Usage: bash setup-duckdns.sh <subdomain> <token>"
    echo ""
    echo "Steps:"
    echo "  1. Go to https://www.duckdns.org"
    echo "  2. Login with Google or GitHub (free)"
    echo "  3. Create a subdomain (e.g., 'aktivar')"
    echo "  4. Copy your token from the dashboard"
    echo "  5. Run: bash setup-duckdns.sh aktivar your-token-here"
    exit 1
fi

DOMAIN="${SUBDOMAIN}.duckdns.org"
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "=========================================="
echo "  DuckDNS Setup for Aktivar"
echo "=========================================="
echo ""
echo "  Subdomain: $DOMAIN"
echo "  Server IP: $SERVER_IP"
echo ""

# ─── Update DuckDNS record ──────────────────────────────────────────────────
echo "Updating DuckDNS record..."
RESULT=$(curl -s "https://www.duckdns.org/update?domains=${SUBDOMAIN}&token=${TOKEN}&ip=${SERVER_IP}")

if [ "$RESULT" = "OK" ]; then
    echo "  DNS record updated successfully!"
else
    echo "  ERROR: DuckDNS returned '$RESULT'. Check your subdomain and token."
    exit 1
fi

# ─── Setup auto-update cron job ─────────────────────────────────────────────
echo "Setting up auto-update cron job (every 5 min)..."
CRON_CMD="*/5 * * * * curl -s 'https://www.duckdns.org/update?domains=${SUBDOMAIN}&token=${TOKEN}&ip=' > /dev/null 2>&1"

# Remove old duckdns cron if exists, then add new
(crontab -l 2>/dev/null | grep -v duckdns.org; echo "$CRON_CMD") | crontab -
echo "  Cron job installed."

# ─── Update .env if it exists ───────────────────────────────────────────────
if [ -f .env ]; then
    echo "Updating .env with domain..."
    sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=${DOMAIN},${SERVER_IP},localhost|" .env
    sed -i "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://${DOMAIN}|" .env
    sed -i "s|CSRF_TRUSTED_ORIGINS=.*|CSRF_TRUSTED_ORIGINS=http://${DOMAIN}|" .env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://${DOMAIN}|" .env
    echo "  .env updated."
fi

echo ""
echo "=========================================="
echo "  DuckDNS configured!"
echo "=========================================="
echo ""
echo "  Your free domain: http://$DOMAIN"
echo ""
echo "  Next steps:"
echo "    1. Wait 1-2 minutes for DNS propagation"
echo "    2. Deploy with: bash deploy.sh $DOMAIN"
echo "    3. Or if already deployed, restart:"
echo "       docker compose restart backend nginx"
echo ""
echo "  To add HTTPS later:"
echo "    bash deploy.sh --ssl $DOMAIN"
echo "=========================================="
