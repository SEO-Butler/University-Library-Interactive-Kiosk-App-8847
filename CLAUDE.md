# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A touch-screen library kiosk (React) plus a separate staff CMS (React, same build) and a
Node/Express server that serves both and provides the API. Data lives in local PostgreSQL;
images live in an S3-compatible object store. Production is a Raspberry Pi; see
`deploy/pi/README.md`. There is no cloud dependency (the old Supabase backend is gone).

## Commands

On the Pi, Node is not on PATH: `export PATH="$HOME/kiosk/node/bin:$PATH"` first.

```sh
npm run setup                 # npm ci for the root (front-ends) and server/
docker compose up -d          # PostgreSQL :5432 + RustFS :9000 for development
cp .env.example .env && set -a && . ./.env && set +a
npm run dev:server            # API + serves dist/ on http://127.0.0.1:8080 (node --watch)
npm run dev                   # Vite on :5173 (kiosk at /, CMS at /cms/), proxies /api to :8080
npm run build                 # eslint . && vite build  -> dist/ (kiosk) + dist/cms/
npm run lint
npm test                      # server unit tests (node --test); integration test skipped
```

Integration tests need a throwaway database (they TRUNCATE it) and a reachable S3 store:

```sh
cd server
TEST_DATABASE_URL=postgresql://kiosk:kiosk@127.0.0.1:5432/kiosk_test \
S3_ENDPOINT=http://127.0.0.1:9000 S3_ACCESS_KEY=kiosk S3_SECRET_KEY=kiosksecret123 S3_BUCKET=kiosk-test \
node --test
node --test test/validation.test.js            # one file
node --test --test-name-pattern="qr link"      # tests matching a name
```

Server maintenance CLI (needs the same env as the server, at least `DATABASE_URL`):

```sh
cd server && node cli.js migrate | seed [--force] | create-user <name> --role admin|editor | set-password <name> | list-users
```

On the Pi the same CLI is `~/kiosk/bin/kiosk-cms-user …`, and `~/kiosk/bin/kiosk-deploy`
builds and publishes the current checkout.

## Architecture

**One process serves everything.** `server/index.js` starts the HTTP server immediately,
then runs two readiness loops: database (apply `server/db/migrations/*.sql`, re-insert
default settings, bootstrap an admin from `CMS_ADMIN_PASSWORD` if there are no users) and
object store (`ensureBucket`). `state.ready` gates every `/api` route except `/api/health`,
so the kiosk keeps showing cached content while Postgres is still coming up.

**Two front-end pages, one Vite build.** `index.html` -> `src/main.jsx` (kiosk) and
`cms/index.html` -> `src/cms/main.jsx` (CMS) are Rollup inputs in `vite.config.js`.
Both use `HashRouter` and `base: './'`, so Express only needs `express.static(dist)`.
Tailwind scans both; class names must be literal strings (see `quickInfoColumns` in
`HomeScreen.jsx` for the pattern when a class depends on data).

**Read path (kiosk).** `src/lib/api.js` fetches a single bundle from
`GET /api/kiosk/content` (published, unexpired items only; Express adds an ETag so
unchanged bundles are 304s). `src/context/AppContext.jsx` sanitises it, stores it in
`localStorage` under `kioskContentCache.v2` and refreshes every 10 minutes, on the Refresh
button and on `online`. On failure it keeps the last good copy and sets `state.error`.
The kiosk never writes; there is no admin UI in it any more. Bump the cache key when the
bundle shape changes.

**Write path (CMS).** `src/cms/api.js` calls `/api/cms/*` with the session cookie; a 401
dispatches `cms:unauthorized`, which `AuthProvider` (`src/cms/auth.jsx`) turns into a
redirect to `#/login`. Server validation failures are `400 { error, errors: { field: msg } }`
and the forms show them per field. `components/EntityPage.jsx` is the generic
list + modal + delete used by announcements, FAQs and QR links; the map, users and
settings pages are hand-written.

**Server layering.** `config.js` (env only) -> `app.js` (security headers incl. CSP with
`script-src 'self'`, `sameOriginOnly` for all non-GET `/api` requests, JSON/cookie parsing,
routers, error mapping) -> `routes/*`. `routes/cms.js` builds CRUD for each content type
from a table name, an order clause, a validator and a presenter. Validators in
`validation.js` accept camelCase request bodies and return snake_case column objects
(`{ partial: true }` for PUT only touches sent fields); `lib/rows.js` turns rows back into
camelCase and builds INSERT/UPDATE statements. Adding a field therefore means: a new
migration file, the validator, the presenter if the name differs, the kiosk SELECT in
`routes/kiosk.js`, and the CMS form. The error handler in `app.js` maps Postgres error
codes (23503 FK, 23505 unique, 23514 check) to 400/409, so routes don't pre-check those.

**Auth.** Sessions are server-side rows (`cms_sessions`, SHA-256 of the cookie token),
sliding expiry, `httpOnly; SameSite=Strict` cookie. Passwords use `node:crypto` scrypt
(`auth/passwords.js`, no native modules). Roles: `editor` (content + settings) and
`admin` (also `/api/cms/users`, guarded by `requireRole('admin')`); `routes/users.js`
refuses to demote, disable or delete the last active admin or the caller. Login is
throttled per account and per IP in memory (`createLoginLimiter`). Every mutation calls
`lib/audit.js`.

**Media.** `POST /api/cms/media` sniffs the real type from the first bytes (PNG, JPEG,
GIF, WebP only; SVG is refused) and stores `media/<uuid>.<ext>` through `storage.js`
(AWS SDK v3, path-style, checksums `WHEN_REQUIRED` for MinIO/RustFS compatibility).
`GET /api/media/:id` is public and immutable-cached; ids never change. Deleting an image
that an announcement or floor still references returns 409.

**Database conventions.** Migrations run in filename order inside a transaction under an
advisory lock; add a new file rather than editing an applied one. `db/pool.js` sets type
parsers so `DATE` comes back as `'YYYY-MM-DD'` strings and `NUMERIC`/`INT8` as numbers.
Settings are two jsonb rows in `kiosk_settings`: `general` (idle timeout, auto-reset) and
`site` (library name, hours, WiFi, help desk); defaults live in `db/seed.js`.

## Kiosk-specific rules

- No blocking dialogs (`alert`, `confirm`) and no navigation the visitor can't recover
  from; the idle timer resets to home, and `ErrorBoundary` reloads on a render crash.
- Interactive elements use `.touch-button` (60px minimum); accessibility classes go on
  `<html>` (`high-contrast`, `large-text`) and are reset per visitor, never persisted.
- Everything must work offline from the cache and without external hosts: fonts are
  bundled via `@fontsource`, the CSP allows no CDNs, QR links must be `https://`
  (`safeQrUrl` on the server, `getSafeUrl` in the kiosk).

## Deployment notes

- The Pi runs user-level systemd units: `kiosk-web` (this server, env from
  `~/kiosk/kiosk.conf` + `~/kiosk/kiosk.env`), `kiosk-storage` (RustFS), plus health,
  display, browser-restart and backup timers. `kiosk-deploy` publishes to `~/kiosk/app`
  atomically, including `server/node_modules` after `npm ci --omit=dev`, so `server/`
  must stay a standalone package (no npm workspaces).
- New settings go into `deploy/pi/kiosk.conf` with a default; `install.sh` appends
  missing keys to existing installs. Secrets go into `kiosk.env`, never `kiosk.conf`.
- RustFS is bundled because MinIO's community binaries are no longer published. Keep
  storage access generic S3; MinIO or any other endpoint is a config change.
- Chromium runs the kiosk with `--kiosk` against `127.0.0.1:8080`; `HOST=0.0.0.0` in
  `kiosk.conf` only exists so staff can reach `/cms/` from the network.
