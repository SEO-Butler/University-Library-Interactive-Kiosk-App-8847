# Shared settings for the kiosk scripts. Sourced, not executed.

KIOSK_HOME="${KIOSK_HOME:-$HOME/kiosk}"
KIOSK_MODE_FLAG="$KIOSK_HOME/kiosk-mode-enabled"
KIOSK_PROFILE="$KIOSK_HOME/chromium-profile"
NODE_DIR="$KIOSK_HOME/node"
APP_DIR="$KIOSK_HOME/app"
ENV_FILE="$KIOSK_HOME/kiosk.env"

# Defaults, overridden by kiosk.conf.
REPO_DIR="$HOME/NUST"
HOST=0.0.0.0
PORT=8080
S3_ENDPOINT=http://127.0.0.1:9000
S3_BUCKET=kiosk-media
DISPLAY_OUTPUT="HDMI-A-2"
HOURS_WEEKDAY=""
HOURS_SATURDAY=""
HOURS_SUNDAY=""
ONSCREEN_KEYBOARD=yes
BACKUP_KEEP=14

if [ -f "$KIOSK_HOME/kiosk.conf" ]; then
  . "$KIOSK_HOME/kiosk.conf"
fi

# The kiosk browser always talks to the local server, whatever HOST is.
KIOSK_URL="http://127.0.0.1:$PORT/"
CMS_URL="http://127.0.0.1:$PORT/cms/"

# Timers and services run outside the desktop session, so point them at it.
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"

kiosk_mode_enabled() {
  [ -f "$KIOSK_MODE_FLAG" ]
}

# Exports the secrets (DATABASE_URL, S3 keys) for scripts that need them.
load_env() {
  if [ -f "$ENV_FILE" ]; then
    set -a
    . "$ENV_FILE"
    set +a
  fi
}

log() {
  echo "[$(basename "$0")] $*"
}
