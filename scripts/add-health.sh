#!/usr/bin/env bash
# ============================================================
# KINETIC — Agrega /healthz al Caddyfile (para monitoring externo)
#
# Uso: sudo ./add-healthz.sh
#
# Qué hace:
#   1. Encuentra el Caddyfile (prueba las rutas típicas)
#   2. Hace un backup con fecha antes de tocar nada
#   3. Si ya existe una ruta /healthz, no hace nada (idempotente)
#   4. Agrega: respond /healthz "OK" 200
#      (Caddy ejecuta 'respond' ANTES que 'basicauth' o
#      'reverse_proxy' por su orden de directivas interno, así que
#      esto queda público sin exponer nada del gateway real)
#   5. Valida la sintaxis con "caddy validate" ANTES de aplicar
#   6. Si es válida, recarga Caddy (systemctl reload, sin downtime)
#   7. Si la validación falla, restaura el backup automáticamente
#      y no toca el servicio corriendo
# ============================================================
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "Corré esto con sudo: sudo ./add-healthz.sh"
  exit 1
fi

# --- 1. Encontrar el Caddyfile ---
CANDIDATES=(/etc/caddy/Caddyfile /etc/caddy/caddyfile /usr/local/etc/caddy/Caddyfile)
CADDYFILE=""
for c in "${CANDIDATES[@]}"; do
  if [ -f "$c" ]; then
    CADDYFILE="$c"
    break
  fi
done

if [ -z "$CADDYFILE" ]; then
  echo "No encontré el Caddyfile en las rutas típicas."
  echo "Corré 'sudo systemctl status caddy' y 'sudo cat /etc/systemd/system/caddy.service'"
  echo "para ver qué --config usa, y pasámelo."
  exit 1
fi

echo "Caddyfile encontrado: $CADDYFILE"

# --- 2. Backup ---
BACKUP="${CADDYFILE}.bak.$(date +%Y%m%d_%H%M%S)"
cp "$CADDYFILE" "$BACKUP"
echo "Backup: $BACKUP"

# --- 3. Idempotencia ---
if grep -q "/healthz" "$CADDYFILE"; then
  echo "Ya existe una referencia a /healthz en el Caddyfile — no toco nada."
  echo "Revisá manualmente si es la línea que esperás:"
  grep -n "/healthz" "$CADDYFILE"
  exit 0
fi

# --- 4. Insertar la línea ---
# La insertamos justo después de la primera línea que abre un bloque de
# sitio (la que termina en "{"). Como 'respond' se reordena solo antes
# que basicauth/reverse_proxy, no importa que quede arriba de todo.
TMP=$(mktemp)
awk '
  !done && /{[[:space:]]*$/ {
    print
    print "\trespond /healthz \"OK\" 200"
    done=1
    next
  }
  { print }
' "$CADDYFILE" > "$TMP"

# --- 5. Validar ANTES de aplicar ---
echo
echo "Validando sintaxis..."
if ! caddy validate --config "$TMP" --adapter caddyfile; then
  echo
  echo "La validación FALLÓ. No toco el Caddyfile real ni reinicio nada."
  echo "El intento de cambio quedó en $TMP para que lo revises si querés."
  exit 1
fi

echo "Sintaxis OK."

# --- 6. Aplicar y recargar ---
cp "$TMP" "$CADDYFILE"
rm -f "$TMP"

echo
echo "Recargando Caddy..."
if systemctl reload caddy; then
  echo "Recargado sin downtime."
else
  echo
  echo "El reload falló. Restaurando el backup automáticamente..."
  cp "$BACKUP" "$CADDYFILE"
  systemctl reload caddy || systemctl restart caddy
  echo "Backup restaurado. Caddy sigue con la config anterior."
  exit 1
fi

echo
echo "============================================================"
echo "LISTO. Probá desde afuera de la VM:"
echo "  curl -i https://kinetic-gym.duckdns.org/healthz"
echo "Tiene que devolver: HTTP/2 200 y el cuerpo \"OK\""
echo "============================================================"
