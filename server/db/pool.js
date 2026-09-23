import pg from 'pg';

// Keep DATE columns as 'YYYY-MM-DD' strings. The default converts them to a local-time
// Date, which shifts the day when serialised back to JSON.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);
// NUMERIC (map coordinates) and BIGINT (file sizes, counts) as numbers, not strings.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => parseFloat(value));
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value));

export function createPool(config) {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 15000,
    application_name: 'library-kiosk'
  });
  // Without a handler an idle client error would crash the process.
  pool.on('error', (error) => console.error('[db] idle client error:', error.message));
  return pool;
}
