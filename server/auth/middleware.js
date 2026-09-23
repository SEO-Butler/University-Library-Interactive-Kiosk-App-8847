import { unauthorized, forbidden, HttpError } from '../lib/errors.js';

const MAX_FAILURES_PER_ACCOUNT = 5;
const MAX_FAILURES_PER_IP = 30;
const LOCKOUT_MS = 15 * 60 * 1000;

// Rejects state-changing requests that did not come from this site's own pages.
// Together with SameSite=Strict cookies this blocks cross-site request forgery
// without needing a token in every form.
export function sameOriginOnly(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) {
    return next(forbidden('Cross-site requests are not allowed'));
  }
  const origin = req.get('origin');
  if (origin) {
    let originHost;
    try {
      originHost = new URL(origin).host;
    } catch {
      return next(forbidden('Invalid Origin header'));
    }
    if (originHost !== req.get('host')) {
      return next(forbidden('Cross-site requests are not allowed'));
    }
  }
  return next();
}

export function createAuth({ sessions, config }) {
  const cookieName = config.session.cookieName;

  async function attachUser(req, res, next) {
    try {
      req.sessionToken = req.cookies?.[cookieName] ?? null;
      req.user = await sessions.lookup(req.sessionToken);
      next();
    } catch (error) {
      next(error);
    }
  }

  function requireAuth(req, res, next) {
    if (!req.user) return next(unauthorized());
    return next();
  }

  function requireRole(role) {
    return (req, res, next) => {
      if (!req.user) return next(unauthorized());
      if (req.user.role !== role) return next(forbidden('This action needs the admin role'));
      return next();
    };
  }

  const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'strict',
    secure: config.session.secureCookie,
    path: '/',
    maxAge: sessions.ttlMs
  });

  return { attachUser, requireAuth, requireRole, cookieName, cookieOptions };
}

// In-memory login throttle. Enough for a single-process kiosk server: after a few
// wrong passwords an account (and, separately, an address) has to wait.
export function createLoginLimiter(now = Date.now) {
  const failures = new Map();

  function entry(key) {
    const current = failures.get(key);
    if (current && current.resetAt > now()) return current;
    const fresh = { count: 0, resetAt: now() + LOCKOUT_MS };
    failures.set(key, fresh);
    return fresh;
  }

  function prune() {
    if (failures.size < 1000) return;
    const time = now();
    for (const [key, value] of failures) {
      if (value.resetAt <= time) failures.delete(key);
    }
  }

  return {
    check(ip, username) {
      const account = failures.get(`u:${username}`);
      const address = failures.get(`ip:${ip}`);
      const time = now();
      const blocked =
        (account && account.resetAt > time && account.count >= MAX_FAILURES_PER_ACCOUNT) ||
        (address && address.resetAt > time && address.count >= MAX_FAILURES_PER_IP);
      if (blocked) {
        const until = Math.max(account?.resetAt ?? 0, address?.resetAt ?? 0);
        const minutes = Math.max(1, Math.ceil((until - time) / 60000));
        throw new HttpError(429, `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
      }
    },
    recordFailure(ip, username) {
      prune();
      entry(`u:${username}`).count += 1;
      entry(`ip:${ip}`).count += 1;
    },
    recordSuccess(ip, username) {
      failures.delete(`u:${username}`);
    }
  };
}
