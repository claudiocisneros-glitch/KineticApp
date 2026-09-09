#!/usr/bin/env bash
# ============================================================
# KINETIC — Configurar Google OAuth en Supabase self-hosted
# Correr DENTRO de ~/supabase/docker  (donde está el .env y el
# docker-compose.yml). NO reinicia nada: solo edita y deja todo listo
# para que revises antes de aplicar.
# ============================================================
set -e

if [ ! -f .env ] || [ ! -f docker-compose.yml ]; then
  echo "ERROR: corré esto dentro de ~/supabase/docker (no encuentro .env / docker-compose.yml)"
  exit 1
fi

# Backups con fecha
STAMP=$(date +%Y%m%d-%H%M%S)
cp .env ".env.bak-$STAMP"
cp docker-compose.yml "docker-compose.yml.bak-$STAMP"
echo "Backups: .env.bak-$STAMP y docker-compose.yml.bak-$STAMP"

# 1) Descomentar las 4 líneas de Google en el compose
sed -i \
 -e 's|^      # GOTRUE_EXTERNAL_GOOGLE_ENABLED: ${GOOGLE_ENABLED}|      GOTRUE_EXTERNAL_GOOGLE_ENABLED: ${GOOGLE_ENABLED}|' \
 -e 's|^      # GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}|      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}|' \
 -e 's|^      # GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_SECRET}|      GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_SECRET}|' \
 -e 's|^      # GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${API_EXTERNAL_URL}/callback|      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${API_EXTERNAL_URL}/auth/v1/callback|' \
 docker-compose.yml

# 2) API_EXTERNAL_URL a HTTPS con el dominio
sed -i 's|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://kinetic-gym.duckdns.org|' .env

# 3) Variables de Google en el .env (solo si no existen ya)
if ! grep -q "^GOOGLE_ENABLED=" .env; then
  cat >> .env << 'EOF'

# Google OAuth
GOOGLE_ENABLED=true
GOOGLE_CLIENT_ID=PEGA_ACA_TU_CLIENT_ID
GOOGLE_SECRET=PEGA_ACA_TU_CLIENT_SECRET
EOF
  echo ">> Agregué GOOGLE_* al .env — falta pegar el Client ID y el Secret."
else
  echo ">> GOOGLE_ENABLED ya existía en .env, no lo toqué."
fi

echo ""
echo "=== Revisá que quedó bien: ==="
echo "--- Google en compose (sin # adelante, redirect en /auth/v1/callback): ---"
grep -n "GOOGLE" docker-compose.yml
echo "--- API_EXTERNAL_URL: ---"
grep -n "^API_EXTERNAL_URL" .env
echo "--- GOOGLE_* en .env: ---"
grep -n "^GOOGLE_" .env
echo ""
echo "Ahora editá el .env y pegá tu Client ID y Secret (nano .env)."
echo "NO reinicié nada. Cuando confirmes, reiniciamos auth."