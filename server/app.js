import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createAuth, createLoginLimiter, sameOriginOnly } from './auth/middleware.js';
import { HttpError, notFound } from './lib/errors.js';
import { authRoutes } from './routes/auth.js';
import { cmsRoutes } from './routes/cms.js';
import { healthRoutes, kioskRoutes } from './routes/kiosk.js';
import { createMediaRoutes } from './routes/media.js';
import { usersRoutes } from './routes/users.js';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

function securityHeaders(req, res, next) {
  res.set({
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
}

// Everything the process serves: kiosk API, CMS API and the built front-ends.
// `state` is shared with index.js, which flips the ready flags once the database
// and object store have been reached.
export function createApp({ config, pool, storage, sessions, state, log = console.log }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', 'weak');
  if (config.trustProxy) app.set('trust proxy', 1);

  const auth = createAuth({ sessions, config });
  const limiter = createLoginLimiter();
  const media = createMediaRoutes({ pool, storage, config, state });

  app.use(securityHeaders);
  app.use('/api', sameOriginOnly, cookieParser(), express.json({ limit: '1mb' }));

  app.use('/api/health', healthRoutes({ pool, storage, state, config }));

  // Nothing else works until the schema is in place.
  app.use('/api', (req, res, next) => {
    if (state.ready) return next();
    next(new HttpError(503, state.dbConfigured
      ? 'The kiosk database is not ready yet. Try again in a moment.'
      : 'DATABASE_URL is not configured on the server.'));
  });

  app.use('/api/kiosk', kioskRoutes({ pool, config }));
  app.use('/api/media', media.publicRouter);
  app.use('/api/auth', authRoutes({ pool, sessions, auth, limiter }));
  app.use(
    '/api/cms',
    cmsRoutes({
      pool, config, auth, storage, state,
      mediaRouter: media.cmsRouter,
      usersRouter: usersRoutes({ pool, sessions })
    })
  );
  app.use('/api', (req, res, next) => next(notFound('Unknown API route')));

  if (config.staticDir) {
    app.use(
      express.static(config.staticDir, {
        setHeaders(res, filePath) {
          // Hashed bundles never change; HTML must be revalidated so deploys show up.
          const immutable = filePath.split(path.sep).includes('assets');
          res.set('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
        }
      })
    );
  }

  app.use((req, res) => {
    res.status(404).type('text').send('Not found');
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    let status = error.status ?? error.statusCode ?? 500;
    let message = error.message;
    const extra = error.extra ?? {};

    if (error.type === 'entity.parse.failed') {
      status = 400; message = 'The request body is not valid JSON';
    } else if (error.type === 'entity.too.large') {
      status = 413; message = 'The request is too large';
    } else if (error.name === 'MulterError') {
      const tooBig = error.code === 'LIMIT_FILE_SIZE';
      status = tooBig ? 413 : 400;
      message = tooBig ? `Images must be smaller than ${Math.round(config.maxUploadBytes / 1048576)} MB` : 'Invalid upload';
    } else if (error.code === '23503') {
      status = 400; message = 'A referenced item (floor or image) does not exist';
    } else if (error.code === '23505') {
      status = 409; message = 'An item with these details already exists';
    } else if (['23514', '22P02', '22001', '22003'].includes(error.code)) {
      status = 400; message = 'One of the values is not valid';
    } else if (
      ['ECONNREFUSED', 'ECONNRESET', '57P01', '57P03', '08006', '08001', '08003', '53300'].includes(error.code) ||
      /timeout exceeded when trying to connect/i.test(error.message ?? '')
    ) {
      status = 503; message = 'The database is not reachable right now';
    }

    if (status >= 500) {
      log(`[error] ${req.method} ${req.originalUrl}: ${error.stack ?? error.message}`);
      if (status !== 503) message = 'Something went wrong on the server';
    }
    res.status(status).json({ error: message, ...extra });
  });

  return app;
}
