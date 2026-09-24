#!/usr/bin/env bash
# ============================================================
# KINETIC — Configura rclone desde un archivo de credenciales
# (en vez de pedirlas por teclado, para evitar errores de tipeo
# o de copy-paste roto en la sesión SSH)
#
# Uso:
#   1. En tu PC, armá ~/creds.env con:
#        OCI_ACCESS_KEY=...
#        OCI_SECRET_KEY=...
#        OCI_NAMESPACE=...
#        OCI_REGION=...
#        OCI_BUCKET=kinetic-backups
#   2. scp -i tu-clave.key creds.env ubuntu@IP:~/
#   3. sudo ./configure-rclone.sh
#
# El archivo creds.env se borra solo al final (haya salido bien o
# mal) — no queda una copia en texto plano dando vueltas en el VM.
# ============================================================
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "Corré esto con sudo: sudo ./configure-rclone.sh"
  exit 1
fi

CREDS_FILE="$HOME/creds.env"
if [ -n "${SUDO_USER:-}" ]; then
  # sudo cambia $HOME a /root — el archivo lo subiste al home del
  # usuario real (ubuntu), así que lo buscamos ahí.
  CREDS_FILE="/home/$SUDO_USER/creds.env"
fi

if [ ! -f "$CREDS_FILE" ]; then
  echo "No encontré $CREDS_FILE"
  echo "Subilo primero con scp desde tu PC (ver instrucciones arriba del script)."
  exit 1
fi

# Borra el archivo de credenciales pase lo que pase al salir de este script.
trap 'rm -f "$CREDS_FILE"; echo "($CREDS_FILE borrado)"' EXIT

# Lee cada línea del archivo, sin usar 'source' (así una línea rara no
# puede ejecutar código) y limpiando espacios/saltos de línea de cada valor.
strip() { echo -n "$1" | tr -d '[:space:]'; }

OCI_ACCESS_KEY=$(strip "$(grep '^OCI_ACCESS_KEY=' "$CREDS_FILE" | cut -d'=' -f2-)")
OCI_SECRET_KEY=$(strip "$(grep '^OCI_SECRET_KEY=' "$CREDS_FILE" | cut -d'=' -f2-)")
OCI_NAMESPACE=$(strip "$(grep '^OCI_NAMESPACE=' "$CREDS_FILE" | cut -d'=' -f2-)")
OCI_REGION=$(strip "$(grep '^OCI_REGION=' "$CREDS_FILE" | cut -d'=' -f2-)")
OCI_BUCKET=$(strip "$(grep '^OCI_BUCKET=' "$CREDS_FILE" | cut -d'=' -f2-)")
OCI_BUCKET="${OCI_BUCKET:-kinetic-backups}"

if [ -z "$OCI_ACCESS_KEY" ] || [ -z "$OCI_SECRET_KEY" ] || [ -z "$OCI_NAMESPACE" ] || [ -z "$OCI_REGION" ]; then
  echo "Faltó algún campo en $CREDS_FILE — revisá que las 4 líneas estén"
  echo "completas (OCI_ACCESS_KEY, OCI_SECRET_KEY, OCI_NAMESPACE, OCI_REGION)."
  exit 1
fi

echo "Access Key leída: ${#OCI_ACCESS_KEY} caracteres"
echo "Secret Key leída: ${#OCI_SECRET_KEY} caracteres"
echo "Namespace: $OCI_NAMESPACE  |  Región: $OCI_REGION  |  Bucket: $OCI_BUCKET"
echo

if rclone listremotes | grep -q '^kinetic-oci:'; then
  echo "Borrando el remote 'kinetic-oci' existente..."
  rclone config delete kinetic-oci
fi

rclone config create kinetic-oci s3 \
  provider=Other \
  access_key_id="$OCI_ACCESS_KEY" \
  secret_access_key="$OCI_SECRET_KEY" \
  endpoint="https://${OCI_NAMESPACE}.compat.objectstorage.${OCI_REGION}.oraclecloud.com" \
  acl=private

echo
echo "Probando conexión al bucket..."
if rclone lsd "kinetic-oci:"; then
  echo
  echo "FUNCIONÓ. El remote está bien configurado."
else
  echo
  echo "Sigue fallando. Ya no es un problema de tipeo (esto vino de un"
  echo "archivo, no de teclado), así que revisá:"
  echo "  1. El bucket '$OCI_BUCKET' existe con ese nombre exacto."
  echo "  2. El namespace/región son los del bucket real (Bucket Details)."
  echo "  3. La Secret Key sigue activa en User Settings > Customer Secret Keys"
  echo "     (no fue borrada o reemplazada después de generarla)."
fi
