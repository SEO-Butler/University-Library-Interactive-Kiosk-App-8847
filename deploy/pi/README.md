# Raspberry Pi kiosk deployment

Runs the kiosk on a Raspberry Pi (Pi OS / Debian 13, labwc desktop) as the logged-in user.
The app is built locally, served on `127.0.0.1` only, and shown in fullscreen Chromium.

## Install / update

```sh
deploy/pi/install.sh
```

No root needed. It is safe to re-run. It:

- copies the scripts to `~/kiosk/bin` and creates `~/kiosk/kiosk.conf` (existing edits are kept)
- installs Node to `~/kiosk/node` (checksum-verified)
- enables user services: `kiosk-web` (static server), plus timers for the health check,
  opening hours and a nightly browser restart
- builds the checked-out branch of the repo and publishes it to `~/kiosk/www`

It does **not** change what starts at login.

## Kiosk mode

```sh
~/kiosk/bin/kiosk-mode on      # next login/reboot starts fullscreen kiosk, no desktop
~/kiosk/bin/kiosk-mode off     # next login/reboot starts the normal desktop
~/kiosk/bin/kiosk-mode status
```

In kiosk mode the labwc session starts only the display layout (kanshi), the on-screen
keyboard and Chromium under `lwrespawn`, which relaunches Chromium whenever it exits.
To get out of kiosk mode, press Ctrl+Alt+F2 (or use SSH), log in, run
`~/kiosk/bin/kiosk-mode off`, then reboot.

## Redeploy after code changes

```sh
git pull && ~/kiosk/bin/kiosk-deploy
```

This builds, swaps the new build in atomically and restarts the kiosk browser.

## Configuration (`~/kiosk/kiosk.conf`)

| Setting | Purpose |
| --- | --- |
| `REPO_DIR` | Checkout to build from |
| `PORT` | Local server port (restart `kiosk-web` after changing it) |
| `DISPLAY_OUTPUT` | Output switched off out of hours (`wlr-randr` lists them) |
| `HOURS_WEEKDAY`, `HOURS_SATURDAY`, `HOURS_SUNDAY` | Screen-on hours, `HH:MM-HH:MM`. Empty means always on |
| `ONSCREEN_KEYBOARD` | Start squeekboard in the kiosk session |

The opening-hours schedule only switches the screen while kiosk mode is on.

## Optional: system hardening (root)

```sh
sudo deploy/pi/root/root-setup.sh            # watchdog, nightly reboot, linger
sudo deploy/pi/root/root-setup.sh --lockdown # also lock down Chromium
sudo deploy/pi/root/root-setup.sh --uninstall
```

- **Hardware watchdog**: the Pi reboots itself if the system hangs.
- **Nightly reboot** at 04:30, only while kiosk mode is on.
- **`--lockdown`**: a Chromium policy that disables dev tools, downloads, printing and
  `chrome://` pages. It applies to *every* Chromium on the Pi, so only use it once the Pi
  is a dedicated kiosk.

## Troubleshooting

```sh
~/kiosk/bin/kiosk-mode status
systemctl --user status kiosk-web
journalctl --user -u 'kiosk-*' --since today
```
