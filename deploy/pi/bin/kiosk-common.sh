# Shared settings for the kiosk scripts. Sourced, not executed.

KIOSK_HOME="${KIOSK_HOME:-$HOME/kiosk}"
KIOSK_MODE_FLAG="$KIOSK_HOME/kiosk-mode-enabled"
KIOSK_PROFILE="$KIOSK_HOME/chromium-profile"
NODE_DIR="$KIOSK_HOME/node"

# Defaults, overridden by kiosk.conf.
REPO_DIR="$HOME/NUST"
PORT=8080
DISPLAY_OUTPUT="HDMI-A-2"
HOURS_WEEKDAY=""
HOURS_SATURDAY=""
HOURS_SUNDAY=""
ONSCREEN_KEYBOARD=yes

if [ -f "$KIOSK_HOME/kiosk.conf" ]; then
  . "$KIOSK_HOME/kiosk.conf"
fi

KIOSK_URL="http://127.0.0.1:$PORT/"

# Timers and services run outside the desktop session, so point them at it.
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"

kiosk_mode_enabled() {
  [ -f "$KIOSK_MODE_FLAG" ]
}

log() {
  echo "[$(basename "$0")] $*"
}
