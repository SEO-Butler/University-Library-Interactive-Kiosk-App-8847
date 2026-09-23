#!/bin/bash
# Optional system-level kiosk hardening. Needs root:
#   sudo deploy/pi/root/root-setup.sh [--lockdown]
#   sudo deploy/pi/root/root-setup.sh --uninstall
#
# Always installs:
#   - the hardware watchdog (the Pi reboots itself if the system hangs for 15s)
#   - a nightly 04:30 reboot, which only happens while kiosk mode is on
#   - lingering for the kiosk user, so the local server starts at boot even before login
# With --lockdown, also installs a Chromium policy that disables dev tools, downloads,
# printing and chrome:// pages. It applies to every Chromium on this Pi, so only use
# it once the Pi is a dedicated kiosk.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo." >&2
  exit 1
fi

KIOSK_USER="${SUDO_USER:-db}"
KIOSK_HOME_DIR="$(getent passwd "$KIOSK_USER" | cut -d: -f6)"
HERE="$(dirname "$(readlink -f "$0")")"

WATCHDOG_CONF=/etc/systemd/system.conf.d/90-kiosk-watchdog.conf
REBOOT_SERVICE=/etc/systemd/system/kiosk-nightly-reboot.service
REBOOT_TIMER=/etc/systemd/system/kiosk-nightly-reboot.timer
POLICY=/etc/chromium/policies/managed/kiosk.json

if [ "${1:-}" = "--uninstall" ]; then
  systemctl disable --now kiosk-nightly-reboot.timer 2>/dev/null || true
  rm -f "$WATCHDOG_CONF" "$REBOOT_SERVICE" "$REBOOT_TIMER" "$POLICY"
  loginctl disable-linger "$KIOSK_USER"
  systemctl daemon-reload
  systemctl daemon-reexec
  echo "Removed kiosk system settings."
  exit 0
fi

mkdir -p "$(dirname "$WATCHDOG_CONF")"
cat > "$WATCHDOG_CONF" <<'EOF'
[Manager]
RuntimeWatchdogSec=15
RebootWatchdogSec=2min
EOF
systemctl daemon-reexec
echo "Hardware watchdog enabled (15s)."

cat > "$REBOOT_SERVICE" <<EOF
[Unit]
Description=Nightly kiosk reboot
ConditionPathExists=$KIOSK_HOME_DIR/kiosk/kiosk-mode-enabled

[Service]
Type=oneshot
ExecStart=/usr/bin/systemctl reboot
EOF
cat > "$REBOOT_TIMER" <<'EOF'
[Unit]
Description=Nightly kiosk reboot at 04:30

[Timer]
OnCalendar=*-*-* 04:30:00

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now kiosk-nightly-reboot.timer
echo "Nightly 04:30 reboot enabled (only while kiosk mode is on)."

loginctl enable-linger "$KIOSK_USER"
echo "Lingering enabled for $KIOSK_USER."

if [ "${1:-}" = "--lockdown" ]; then
  mkdir -p "$(dirname "$POLICY")"
  install -m 644 "$HERE/chromium-kiosk-policy.json" "$POLICY"
  echo "Chromium lockdown policy installed at $POLICY (applies to all Chromium use on this Pi)."
fi
