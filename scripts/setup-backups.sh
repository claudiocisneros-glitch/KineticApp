cat > ~/setup-backups.sh << 'SCRIPT_END'
#!/usr/bin/env bash
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "Corré esto con sudo: sudo ./setup-backups.sh"
  exit 1
fi

BACKUP_DIR="/opt/kinetic-backups"
SCRIPT_PATH="$BACKUP_DIR/backup-db.sh"
CRON_LINE="0 4 * * * $SCRIPT_PATH >> /var/log/kinetic-backup.log 2>&1"

echo "=== 1/6 — Detectando el contenedor de Postgres ==="
DETECTED=$(docker ps --format '{{.Names}}' | grep -i postgres || true)
if [ -n "$DETECTED" ]; then
  echo "Encontrado: $DETECTED"
  read -rp "Nombre del contenedor de Postgres [$DETECTED]: " CONTAINER
  CONTAINER="${CONTAINER:-$DETECTED}"
else
  read -rp "No lo detecté solo. Nombre del contenedor de Postgres (ver 'docker ps'): " CONTAINER
fi

echo
echo "=== 2/6 — Creando $SCRIPT_PATH ==="
mkdir -p "$BACKUP_DIR"
cat > "$SCRIPT_PATH" << EOF
#!/usr/bin/env bash
set -euo pipefail

CONTAINER="$CONTAINER"
DB_USER="postgres"
DB_NAME="postgres"
BACKUP_DIR="$BACKUP_DIR"
RETENTION_DAYS=7
DATE=\$(date +%Y-%m-%d_%H%M)
FILE="\$BACKUP_DIR/kinetic_\$DATE.sql.gz"

mkdir -p "\$BACKUP_DIR"

docker exec "\$CONTAINER" pg_dump -U "\$DB_USER" "\$DB_NAME" | gzip > "\$FILE"

find "\$BACKUP_DIR" -name "kinetic_*.sql.gz" -mtime +\$RETENTION_DAYS -delete

echo "Backup OK: \$FILE (\$(du -h "\$FILE" | cut -f1))"
EOF
chmod +x "$SCRIPT_PATH"
echo "Listo."

echo
echo "=== 3/6 — rclone (subida a Object Storage) ==="
if ! command -v rclone >/dev/null 2>&1; then
  echo "Instalando rclone..."
  apt-get update -qq && apt-get install -y rclone
else
  echo "Ya estaba instalado."
fi

if rclone listremotes | grep -q '^kinetic-oci:'; then
  echo "El remote 'kinetic-oci' ya existe — lo dejo como está."
else
  echo
  echo "Necesito los datos de tu bucket de Object Storage (los sacás de"
  echo "la consola de Oracle: Storage > Buckets > tu bucket > Bucket Details"
  echo "para el namespace/región, y Perfil > User Settings > Customer Secret"
  echo "Keys > Generate Secret Key para las claves)."
  echo
  read -rp "Access Key: " OCI_ACCESS_KEY
  read -rsp "Secret Key (no se muestra en pantalla): " OCI_SECRET_KEY
  echo
  read -rp "Namespace (ej: axabc123def): " OCI_NAMESPACE
  read -rp "Región (ej: sa-saopaulo-1): " OCI_REGION
  read -rp "Nombre del bucket [kinetic-backups]: " OCI_BUCKET
  OCI_BUCKET="${OCI_BUCKET:-kinetic-backups}"

  rclone config create kinetic-oci s3 \
    provider=Other \
    access_key_id="$OCI_ACCESS_KEY" \
    secret_access_key="$OCI_SECRET_KEY" \
    endpoint="https://${OCI_NAMESPACE}.compat.objectstorage.${OCI_REGION}.oraclecloud.com" \
    acl=private

  echo
  echo "Probando conexión al bucket..."
  if rclone lsd "kinetic-oci:" >/dev/null 2>&1; then
    echo "Conectó bien."
  else
    echo "No pude listar el bucket. Revisá que el bucket '$OCI_BUCKET' exista"
    echo "y que namespace/región estén bien. Podés reintentar corriendo:"
    echo "  rclone config"
    echo "más tarde a mano — el resto del script sigue igual."
  fi

  echo
  echo "=== 4/6 — Agregando la subida a Object Storage al script de backup ==="
  if ! grep -q "rclone copy" "$SCRIPT_PATH"; then
    sed -i "/^echo \"Backup OK/i rclone copy \"\$FILE\" kinetic-oci:$OCI_BUCKET/ >/dev/null 2>&1 || echo \"AVISO: no se pudo subir a Object Storage\"" "$SCRIPT_PATH"
    echo "Agregada."
  fi
fi

echo
echo "=== 5/6 — Probando un backup real ahora ==="
"$SCRIPT_PATH"

echo
echo "=== 6/6 — Programando el cron diario (4am) ==="
CRONTAB_TMP=$(mktemp)
crontab -l 2>/dev/null > "$CRONTAB_TMP" || true
if grep -qF "$SCRIPT_PATH" "$CRONTAB_TMP"; then
  echo "Ya estaba programado — no lo duplico."
else
  echo "$CRON_LINE" >> "$CRONTAB_TMP"
  crontab "$CRONTAB_TMP"
  echo "Programado: todos los días a las 4am."
fi
rm -f "$CRONTAB_TMP"

echo
echo "============================================================"
echo "LISTO. Backups en $BACKUP_DIR, subida a Object Storage, cron a las 4am."
echo
echo "Lo único que falta, y es un toggle en la consola web de Oracle"
echo "(no se puede hacer desde acá por SSH):"
echo "  Compute > Instances > tu instancia > Boot Volume > click en el"
echo "  volumen > Backups > Enable Backup Policy > elegí 'Bronze'"
echo "============================================================"
SCRIPT_END
chmod +x ~/setup-backups.sh
