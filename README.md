# University Library Interactive Kiosk

A touch-screen information kiosk for a university library, with a separate content
management system (CMS) for staff. Runs on a Raspberry Pi with local PostgreSQL and
S3-compatible object storage; no cloud services are needed.

- **Kiosk** (`/`): library map with floor plans, FAQs with search, QR-code quick links,
  news & events, accessibility options, idle reset. Works offline from its last good copy.
- **CMS** (`/cms/`): password-protected, role-based (admin / editor). Manage announcements
  (with pictures and expiry), FAQs, QR links, floors and map locations (click-to-place on
  an uploaded plan), images, kiosk behaviour and library details, and user accounts.
  Every change is written to an audit log.
- **Server** (`server/`): Node + Express API, PostgreSQL via `pg`, images in any
  S3-compatible store (MinIO, RustFS, Garage, AWS S3) via the AWS SDK. Session cookies,
  scrypt password hashing, login throttling, same-origin write protection, CSP.

## Layout

```
index.html, src/            kiosk front-end (React + Vite + Tailwind)
cms/index.html, src/cms/    CMS front-end (same build, second page)
server/                     API + static host (own package.json)
  db/migrations/            schema, applied automatically on start
  cli.js                    migrate | seed | create-user | set-password | ...
deploy/pi/                  Raspberry Pi install, services and scripts
docker-compose.yml          PostgreSQL + object store for development
```

## Development

Requirements: Node 20+, Docker (for the database and object store) or your own
PostgreSQL + S3-compatible server.

```sh
npm run setup                 # installs front-end and server dependencies
docker compose up -d          # PostgreSQL on :5432, object store on :9000
cp .env.example .env          # defaults match docker-compose
set -a; . ./.env; set +a
npm --prefix server run user -- create-user admin --role admin   # first CMS account
npm --prefix server run seed                                     # optional sample content
npm run dev:server            # API + built files on http://127.0.0.1:8080
npm run dev                   # Vite dev server: kiosk on :5173, CMS on :5173/cms/
```

`npm run build` lints and builds both pages into `dist/`; `npm test` runs the server's
unit tests, and the integration tests too when `TEST_DATABASE_URL` points at a throwaway
database.

## Deployment

See [deploy/pi/README.md](deploy/pi/README.md) for the Raspberry Pi: `install.sh` (as the
kiosk user), `root/setup-postgres.sh` (once, with sudo), then `install.sh` again.

## Configuration

All server settings are environment variables; see [.env.example](.env.example). On the Pi
they live in `~/kiosk/kiosk.conf` and `~/kiosk/kiosk.env`.
