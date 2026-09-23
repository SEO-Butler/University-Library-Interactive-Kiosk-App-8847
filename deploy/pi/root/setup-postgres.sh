#!/bin/bash
# Install PostgreSQL for the kiosk and create its database. Needs root:
#   sudo deploy/pi/root/setup-postgres.sh
# Safe to re-run. It:
#   - installs postgresql + postgresql-client from the Pi OS repositories
#   - creates role 'kiosk' (random password) and database 'kiosk' owned by it
#   - writes DATABASE_URL to the kiosk user's ~/kiosk/kiosk.env (mode 600)
# PostgreSQL only listens on 127.0.0.1 (the Debian default), so the database is not
# reachable from the network.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo." >&2
  exit 1
fi

KIOSK_USER="${SUDO_USER:-}"
if [ -z "$KIOSK_USER" ] || [ "$KIOSK_USER" = root ]; then
  echo "Run this with sudo from the kiosk user's account (sudo -u is not enough)." >&2
  exit 1
fi
KIOSK_HOME_DIR="$(getent passwd "$KIOSK_USER" | cut -d: -f6)"
ENV_FILE="$KIOSK_HOME_DIR/kiosk/kiosk.env"
DB_NAME="${DB_NAME:-kiosk}"
DB_ROLE="${DB_ROLE:-kiosk}"

if ! command -v psql > /dev/null || ! systemctl list-unit-files postgresql.service > /dev/null 2>&1; then
  echo "==> Installing PostgreSQL"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq postgresql postgresql-client
fi
systemctl enable --now postgresql

# Wait for the server socket.
for _ in $(seq 1 30); do
  sudo -u postgres psql -qtAc 'SELECT 1' > /dev/null 2>&1 && break
  sleep 1
done

mkdir -p "$(dirname "$ENV_FILE")"
chown "$KIOSK_USER:" "$(dirname "$ENV_FILE")"
if [ ! -f "$ENV_FILE" ]; then
  ( umask 077; : > "$ENV_FILE" )
  chown "$KIOSK_USER:" "$ENV_FILE"
fi
chmod 600 "$ENV_FILE"

EXISTING_URL="$(grep '^DATABASE_URL=' "$ENV_FILE" | tail -1 | cut -d= -f2- || true)"
if [ -n "$EXISTING_URL" ]; then
  DB_PASSWORD="$(printf '%s' "$EXISTING_URL" | sed -n 's#^postgres\(ql\)\?://[^:]*:\([^@]*\)@.*#\2#p')"
else
  DB_PASSWORD="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)"
fi

echo "==> Creating role '$DB_ROLE' and database '$DB_NAME'"
ROLE_EXISTS="$(sudo -u postgres psql -qtAc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_ROLE'")"
if [ "$ROLE_EXISTS" = "1" ]; then
  sudo -u postgres psql -qc "ALTER ROLE $DB_ROLE WITH LOGIN PASSWORD '$DB_PASSWORD'"
else
  sudo -u postgres psql -qc "CREATE ROLE $DB_ROLE WITH LOGIN PASSWORD '$DB_PASSWORD'"
fi
DB_EXISTS="$(sudo -u postgres psql -qtAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")"
if [ "$DB_EXISTS" != "1" ]; then
  sudo -u postgres createdb -O "$DB_ROLE" -E UTF8 "$DB_NAME"
fi

if [ -z "$EXISTING_URL" ]; then
  {
    echo "# PostgreSQL connection for the kiosk server (written by setup-postgres.sh)."
    echo "DATABASE_URL=postgresql://$DB_ROLE:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME"
  } >> "$ENV_FILE"
  echo "    DATABASE_URL written to $ENV_FILE"
else
  echo "    Keeping existing DATABASE_URL in $ENV_FILE"
fi

# Restart the kiosk server if it is already installed so it picks up the database.
if sudo -u "$KIOSK_USER" XDG_RUNTIME_DIR="/run/user/$(id -u "$KIOSK_USER")" \
     systemctl --user is-enabled kiosk-web.service > /dev/null 2>&1; then
  sudo -u "$KIOSK_USER" XDG_RUNTIME_DIR="/run/user/$(id -u "$KIOSK_USER")" \
    systemctl --user restart kiosk-web.service || true
fi

cat <<MSG

PostgreSQL is ready (database '$DB_NAME', role '$DB_ROLE', 127.0.0.1:5432).
Now finish the install as $KIOSK_USER:

    $KIOSK_HOME_DIR/NUST/deploy/pi/install.sh

MSG
