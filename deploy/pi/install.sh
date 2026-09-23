#!/bin/bash
# Install or update the library kiosk for the current user. No root needed for this
# script; PostgreSQL is the one root step (see the end of the output).
# Safe to re-run: it updates scripts and units, keeps ~/kiosk/kiosk.conf (appending any
# new settings), keeps ~/kiosk/kiosk.env, and redeploys the app.
# It does NOT switch the desktop into kiosk mode; run ~/kiosk/bin/kiosk-mode on for that.
set -euo pipefail

HERE="$(dirname "$(readlink -f "$0")")"
KIOSK_HOME="$HOME/kiosk"
UNIT_DIR="$HOME/.config/systemd/user"

NODE_VERSION="v22.20.0"
NODE_DIST="node-$NODE_VERSION-linux-arm64"

# MinIO-compatible object store. MinIO's own community binaries are no longer published
# (the project is archived), so the kiosk ships RustFS, which speaks the same S3 API.
RUSTFS_VERSION="1.0.0"
RUSTFS_ZIP="rustfs-linux-aarch64-gnu-v$RUSTFS_VERSION.zip"
RUSTFS_SHA256="780e832d68e0148dc042f05647796056fe014e7cf1a8f195e3e83b22a3bb988f"
RUSTFS_URL="https://github.com/rustfs/rustfs/releases/download/$RUSTFS_VERSION/$RUSTFS_ZIP"

random_secret() {
  head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c "${1:-32}"
}

echo "==> Installing scripts to $KIOSK_HOME/bin"
mkdir -p "$KIOSK_HOME/bin" "$KIOSK_HOME/data/objects" "$KIOSK_HOME/backups"
chmod 700 "$KIOSK_HOME/data" "$KIOSK_HOME/backups"
install -m 755 "$HERE"/bin/kiosk-* "$KIOSK_HOME/bin/"
chmod 644 "$KIOSK_HOME/bin/kiosk-common.sh"

if [ ! -f "$KIOSK_HOME/kiosk.conf" ]; then
  install -m 644 "$HERE/kiosk.conf" "$KIOSK_HOME/kiosk.conf"
  echo "    Created $KIOSK_HOME/kiosk.conf"
else
  # Keep the operator's edits; add settings introduced by newer versions.
  ADDED=0
  while IFS= read -r line; do
    key="${line%%=*}"
    if [[ "$line" =~ ^[A-Z_]+= ]] && ! grep -q "^$key=" "$KIOSK_HOME/kiosk.conf"; then
      [ "$ADDED" -eq 0 ] && printf '\n# Added by install.sh on %s\n' "$(date +%F)" >> "$KIOSK_HOME/kiosk.conf"
      echo "$line" >> "$KIOSK_HOME/kiosk.conf"
      ADDED=$((ADDED + 1))
    fi
  done < "$HERE/kiosk.conf"
  echo "    Keeping existing $KIOSK_HOME/kiosk.conf ($ADDED new setting(s) appended)"
fi

if [ "$("$KIOSK_HOME/node/bin/node" --version 2>/dev/null)" != "$NODE_VERSION" ]; then
  echo "==> Installing Node $NODE_VERSION to $KIOSK_HOME/node"
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  BASE="https://nodejs.org/dist/$NODE_VERSION"
  curl -fsSL -o "$TMP/$NODE_DIST.tar.xz" "$BASE/$NODE_DIST.tar.xz"
  curl -fsSL -o "$TMP/SHASUMS256.txt" "$BASE/SHASUMS256.txt"
  (cd "$TMP" && grep " $NODE_DIST.tar.xz\$" SHASUMS256.txt | sha256sum -c -)
  tar -xJf "$TMP/$NODE_DIST.tar.xz" -C "$TMP"
  rm -rf "$KIOSK_HOME/node"
  mv "$TMP/$NODE_DIST" "$KIOSK_HOME/node"
fi

if [ "$("$KIOSK_HOME/rustfs/rustfs" --version 2>/dev/null | head -1)" != "rustfs $RUSTFS_VERSION" ]; then
  echo "==> Installing RustFS $RUSTFS_VERSION (S3 object store) to $KIOSK_HOME/rustfs"
  TMP2="$(mktemp -d)"
  curl -fsSL -o "$TMP2/$RUSTFS_ZIP" "$RUSTFS_URL"
  echo "$RUSTFS_SHA256  $TMP2/$RUSTFS_ZIP" | sha256sum -c -
  mkdir -p "$TMP2/unpack"
  unzip -q -o "$TMP2/$RUSTFS_ZIP" rustfs -d "$TMP2/unpack"
  mkdir -p "$KIOSK_HOME/rustfs"
  install -m 755 "$TMP2/unpack/rustfs" "$KIOSK_HOME/rustfs/rustfs"
  rm -rf "$TMP2"
fi

echo "==> Secrets in $KIOSK_HOME/kiosk.env"
ENV_FILE="$KIOSK_HOME/kiosk.env"
if [ ! -f "$ENV_FILE" ]; then
  ( umask 077; : > "$ENV_FILE" )
  echo "    Created $ENV_FILE"
fi
chmod 600 "$ENV_FILE"
if ! grep -q '^S3_ACCESS_KEY=' "$ENV_FILE"; then
  ACCESS="kiosk$(random_secret 12)"
  SECRET="$(random_secret 40)"
  {
    echo "# Object store credentials (used by kiosk-storage and the API server)."
    echo "S3_ACCESS_KEY=$ACCESS"
    echo "S3_SECRET_KEY=$SECRET"
    echo "RUSTFS_ACCESS_KEY=$ACCESS"
    echo "RUSTFS_SECRET_KEY=$SECRET"
  } >> "$ENV_FILE"
  echo "    Generated object store credentials"
fi

echo "==> Installing systemd user units"
mkdir -p "$UNIT_DIR"
install -m 644 "$HERE"/systemd/kiosk-* "$UNIT_DIR/"
systemctl --user daemon-reload
systemctl --user enable --now kiosk-storage.service kiosk-web.service \
  kiosk-health.timer kiosk-display.timer kiosk-browser-restart.timer kiosk-backup.timer
systemctl --user restart kiosk-storage.service

echo "==> Building and publishing the app"
"$KIOSK_HOME/bin/kiosk-deploy" --no-reload

echo
"$KIOSK_HOME/bin/kiosk-mode" status
echo
. "$KIOSK_HOME/bin/kiosk-common.sh"
load_env
if [ -z "${DATABASE_URL:-}" ]; then
  cat <<MSG
Done, except for the database. PostgreSQL needs root to install. Run:

    sudo $HERE/root/setup-postgres.sh

It installs PostgreSQL, creates the kiosk database and writes DATABASE_URL to
$ENV_FILE. Then run this installer again to finish (it creates the first CMS
admin account and loads sample content).
MSG
  exit 0
fi

if [ "$("$KIOSK_HOME/bin/kiosk-cms-user" count-users 2>/dev/null || echo x)" = "0" ]; then
  echo "==> Creating the first CMS admin account"
  ADMIN_PASSWORD="$(random_secret 16)"
  CMS_PASSWORD="$ADMIN_PASSWORD" "$KIOSK_HOME/bin/kiosk-cms-user" create-user admin --role admin --name "Administrator"
  "$KIOSK_HOME/bin/kiosk-cms-user" seed > /dev/null || true
  cat <<MSG

  ============================================================
   CMS sign-in:  http://$(hostname -I 2>/dev/null | awk '{print $1}'):$PORT/cms/
   Username:     admin
   Password:     $ADMIN_PASSWORD
  ============================================================
  Write the password down now; it is not stored anywhere. Change it after the
  first sign-in (Your account > Change password), or reset it any time with:
      $KIOSK_HOME/bin/kiosk-cms-user set-password admin

MSG
fi

echo "Done. Next steps:"
echo "  Kiosk preview:  chromium --app=$KIOSK_URL"
echo "  CMS:            http://<this-pi>:$PORT/cms/"
echo "  Kiosk on boot:  $KIOSK_HOME/bin/kiosk-mode on   (then reboot)"
echo "  Redeploy:       $KIOSK_HOME/bin/kiosk-deploy"
echo "  CMS accounts:   $KIOSK_HOME/bin/kiosk-cms-user list-users"
echo "  Optional root:  sudo $HERE/root/root-setup.sh [--lockdown]"
