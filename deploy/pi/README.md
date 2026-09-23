# Raspberry Pi kiosk deployment

Runs the kiosk on a Raspberry Pi (Pi OS / Debian 13, labwc desktop) as the logged-in user.
One Node server serves the kiosk screen, the staff CMS at `/cms/` and the API, backed by a
local PostgreSQL database and a local S3-compatible object store for images.

```
Chromium (--kiosk) ──► http://127.0.0.1:8080/        kiosk screen
Staff browsers     ──► http://<pi>:8080/cms/         content manager (login)
                          │
                   kiosk-web.service  (Node, ~/kiosk/app)
                     ├── PostgreSQL 127.0.0.1:5432   (system service, root install)
                     └── kiosk-storage.service        RustFS, S3 API, 127.0.0.1:9000
                                                      data in ~/kiosk/data/objects
```

## Install / update

```sh
deploy/pi/install.sh                       # 1. as the kiosk user (no root)
sudo deploy/pi/root/setup-postgres.sh      # 2. once: installs PostgreSQL, creates the database
deploy/pi/install.sh                       # 3. again: creates the CMS admin, loads sample content
```

`install.sh` is safe to re-run. It:

- copies the scripts to `~/kiosk/bin` and creates `~/kiosk/kiosk.conf` (existing edits are
  kept; new settings are appended with defaults)
- installs Node to `~/kiosk/node` and RustFS to `~/kiosk/rustfs` (both checksum-verified)
- generates object-store credentials in `~/kiosk/kiosk.env` (mode 600)
- enables user services: `kiosk-web`, `kiosk-storage`, plus timers for the health check,
  opening hours, a nightly browser restart and a nightly backup
- builds the checked-out branch and publishes it to `~/kiosk/app`
- on the first run with a database: creates the `admin` CMS account (the password is
  printed once) and loads sample content

It does **not** change what starts at login.

`setup-postgres.sh` needs root once. It installs PostgreSQL from the Pi OS repositories,
creates role and database `kiosk`, and writes `DATABASE_URL` to `~/kiosk/kiosk.env`.
PostgreSQL only listens on 127.0.0.1.

## CMS

Staff sign in at `http://<pi-address>:8080/cms/` from any computer on the same network
(set `HOST=127.0.0.1` in `kiosk.conf` to allow the Pi only). Two roles:

- **editor**: announcements, FAQs, QR links, floors and map locations, images, kiosk settings
- **admin**: the same plus user accounts

Accounts can also be managed on the Pi:

```sh
~/kiosk/bin/kiosk-cms-user list-users
~/kiosk/bin/kiosk-cms-user create-user jane --role editor --name "Jane Doe"
~/kiosk/bin/kiosk-cms-user set-password admin
~/kiosk/bin/kiosk-cms-user disable-user jane
```

The kiosk re-reads content every 10 minutes, when its Refresh button is tapped, and when
it comes back online. It keeps the last good copy in the browser, so it still works while
the server is restarting.

## Kiosk mode

```sh
~/kiosk/bin/kiosk-mode on      # next login/reboot starts fullscreen kiosk, no desktop
~/kiosk/bin/kiosk-mode off     # next login/reboot starts the normal desktop
~/kiosk/bin/kiosk-mode status
```

In kiosk mode the login runs `~/kiosk/bin/kiosk-session`: it stops the desktop and panel
(Pi OS runs labwc with `--merge-config`, so the system autostart always runs too), starts
the on-screen keyboard and runs Chromium under `lwrespawn`, which relaunches Chromium
whenever it exits. To start the kiosk in the current session without rebooting, run
`~/kiosk/bin/kiosk-session &`.
To get out of kiosk mode, press Ctrl+Alt+F2 (or use SSH), log in, run
`~/kiosk/bin/kiosk-mode off`, then reboot.

## Redeploy after code changes

```sh
git pull && ~/kiosk/bin/kiosk-deploy
```

This builds the kiosk and CMS, installs the server's dependencies, swaps the new copy in
atomically, restarts `kiosk-web` (database migrations run on start) and restarts the kiosk
browser.

## Configuration

`~/kiosk/kiosk.conf` (plain settings, loaded by the scripts and the services):

| Setting | Purpose |
| --- | --- |
| `REPO_DIR` | Checkout to build from |
| `HOST`, `PORT` | Where the web server listens (`0.0.0.0` = network, `127.0.0.1` = Pi only) |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_FORCE_PATH_STYLE` | Object store for images |
| `QR_ALLOWED_HOSTS` | Restrict QR links to these hosts (empty = any https link) |
| `MAX_UPLOAD_MB` | Largest image upload |
| `DISPLAY_OUTPUT` | Output switched off out of hours (`wlr-randr` lists them) |
| `HOURS_WEEKDAY`, `HOURS_SATURDAY`, `HOURS_SUNDAY` | Screen-on hours, `HH:MM-HH:MM`. Empty means always on |
| `ONSCREEN_KEYBOARD` | Start squeekboard in the kiosk session |
| `BACKUP_KEEP` | Nightly backups to keep |

`~/kiosk/kiosk.env` (secrets, mode 600): `DATABASE_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
(and the same values as `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` for the storage service).
Restart `kiosk-web` after editing either file: `systemctl --user restart kiosk-web`.

### Using MinIO or another S3 server instead of the bundled store

The server only needs an S3-compatible endpoint. MinIO's community binaries are no longer
published (the project is archived and receives no security updates), which is why the Pi
install ships RustFS. If you already run MinIO or another S3 service:

1. Create a bucket and an access key there.
2. Set `S3_ENDPOINT` and `S3_BUCKET` in `kiosk.conf`, and `S3_ACCESS_KEY` / `S3_SECRET_KEY`
   in `kiosk.env`.
3. `systemctl --user disable --now kiosk-storage && systemctl --user restart kiosk-web`.

## Backups and restore

`kiosk-backup.timer` writes `~/kiosk/backups/db-<stamp>.sql.gz` (pg_dump) and
`objects-<stamp>.tar.gz` (images) every night at 03:30 and keeps the newest `BACKUP_KEEP`
of each. Copy that directory somewhere off the Pi's SD card regularly.

Restore on a fresh install (after both install steps):

```sh
systemctl --user stop kiosk-web kiosk-storage
. ~/kiosk/kiosk.env
gunzip -c ~/kiosk/backups/db-<stamp>.sql.gz | psql "$DATABASE_URL"
rm -rf ~/kiosk/data/objects && tar -xzf ~/kiosk/backups/objects-<stamp>.tar.gz -C ~/kiosk/data
systemctl --user start kiosk-storage kiosk-web
```

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
curl -s http://127.0.0.1:8080/api/health          # {"ok":true,"db":"ok","storage":"ok",...}
systemctl --user status kiosk-web kiosk-storage
journalctl --user -u kiosk-web --since today
journalctl --user -u 'kiosk-*' --since today
sudo systemctl status postgresql
```

- `"db":"unconfigured"`: `DATABASE_URL` is missing; run `setup-postgres.sh`.
- `"db":"starting"` for more than a minute: check `journalctl --user -u kiosk-web` for the
  connection error (wrong password in `kiosk.env`, PostgreSQL not running).
- `"storage":"down"`: `systemctl --user restart kiosk-storage`; the health timer does this
  automatically every two minutes.
- The kiosk shows "Some information could not be updated": the API is unreachable; the
  screen keeps showing the last good content until it is back.
