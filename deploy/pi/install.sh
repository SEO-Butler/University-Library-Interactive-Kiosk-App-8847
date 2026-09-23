#!/bin/bash
# Install or update the library kiosk for the current user. No root needed.
# Safe to re-run: it updates scripts and units, keeps ~/kiosk/kiosk.conf, and redeploys.
# It does NOT switch the desktop into kiosk mode; run ~/kiosk/bin/kiosk-mode on for that.
set -euo pipefail

HERE="$(dirname "$(readlink -f "$0")")"
KIOSK_HOME="$HOME/kiosk"
NODE_VERSION="v22.20.0"
NODE_DIST="node-$NODE_VERSION-linux-arm64"
UNIT_DIR="$HOME/.config/systemd/user"

echo "==> Installing scripts to $KIOSK_HOME/bin"
mkdir -p "$KIOSK_HOME/bin" "$KIOSK_HOME/www"
install -m 755 "$HERE"/bin/kiosk-* "$KIOSK_HOME/bin/"
chmod 644 "$KIOSK_HOME/bin/kiosk-common.sh"
if [ ! -f "$KIOSK_HOME/kiosk.conf" ]; then
  install -m 644 "$HERE/kiosk.conf" "$KIOSK_HOME/kiosk.conf"
  echo "    Created $KIOSK_HOME/kiosk.conf"
else
  echo "    Keeping existing $KIOSK_HOME/kiosk.conf"
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

echo "==> Installing systemd user units"
mkdir -p "$UNIT_DIR"
install -m 644 "$HERE"/systemd/kiosk-* "$UNIT_DIR/"
systemctl --user daemon-reload
systemctl --user enable --now kiosk-web.service kiosk-health.timer kiosk-display.timer kiosk-browser-restart.timer
systemctl --user restart kiosk-web.service

echo "==> Building and publishing the app"
"$KIOSK_HOME/bin/kiosk-deploy" --no-reload

echo
"$KIOSK_HOME/bin/kiosk-mode" status
echo
. "$KIOSK_HOME/bin/kiosk-common.sh"
echo "Done. Next steps:"
echo "  Preview:        chromium --app=$KIOSK_URL"
echo "  Kiosk on boot:  $KIOSK_HOME/bin/kiosk-mode on   (then reboot)"
echo "  Redeploy:       $KIOSK_HOME/bin/kiosk-deploy"
echo "  Optional root:  sudo $HERE/root/root-setup.sh [--lockdown]"
