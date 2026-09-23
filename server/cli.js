#!/usr/bin/env node
// Maintenance commands for the kiosk server. Run from the server directory with the
// same environment as the service (DATABASE_URL etc.).
import readline from 'node:readline';
import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { contentIsEmpty, seedSampleContent } from './db/seed.js';
import { hashPassword, validatePasswordStrength } from './auth/passwords.js';
import { USERNAME_PATTERN, ROLES } from './validation.js';

const USAGE = `Usage: node cli.js <command> [options]

  migrate                      Apply pending database migrations
  seed [--force]               Insert sample content (only into an empty database unless --force)
  create-user <username>       Create a CMS account
      [--role admin|editor] [--name "Display Name"] [--password-stdin]
  set-password <username>      Change an account's password [--password-stdin]
  list-users                   Show all CMS accounts
  enable-user <username>       Re-enable an account
  disable-user <username>      Disable an account and sign it out everywhere
  count-users                  Print the number of CMS accounts

Passwords are prompted for unless --password-stdin is given (or CMS_PASSWORD is set).`;

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, options };
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    const write = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (text) => {
      if (!muted) write(text);
    };
    rl.question(question, (answer) => {
      muted = false;
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

async function readStdin() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, '');
}

async function getPassword(options) {
  let password;
  if (options['password-stdin']) {
    password = await readStdin();
  } else if (process.env.CMS_PASSWORD) {
    password = process.env.CMS_PASSWORD;
  } else if (process.stdin.isTTY) {
    password = await promptHidden('Password: ');
    const again = await promptHidden('Repeat password: ');
    if (password !== again) throw new Error('Passwords do not match');
  } else {
    throw new Error('No terminal: pass --password-stdin or set CMS_PASSWORD');
  }
  const weak = validatePasswordStrength(password);
  if (weak) throw new Error(weak);
  return password;
}

function username(value) {
  const name = String(value ?? '').trim().toLowerCase();
  if (!USERNAME_PATTERN.test(name)) {
    throw new Error('Username must be 3-32 characters: lowercase letters, digits, dot, dash or underscore');
  }
  return name;
}

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [command, arg] = positional;
  if (!command || options.help) {
    console.log(USAGE);
    return;
  }

  const config = loadConfig();
  if (!config.databaseUrl) throw new Error('DATABASE_URL is not set');
  const pool = createPool(config);

  try {
    // Every command needs the schema.
    const ran = await migrate(pool);
    if (command === 'migrate') {
      console.log(ran.length ? `Applied: ${ran.join(', ')}` : 'Database is up to date');
      return;
    }

    switch (command) {
      case 'seed': {
        if (!options.force && !(await contentIsEmpty(pool))) {
          console.log('Database already has content; use --force to add the samples anyway');
          return;
        }
        await seedSampleContent(pool);
        console.log('Sample content inserted');
        return;
      }
      case 'create-user': {
        const name = username(arg);
        const role = options.role ?? 'editor';
        if (!ROLES.includes(role)) throw new Error(`Role must be one of: ${ROLES.join(', ')}`);
        const { rows } = await pool.query('SELECT 1 FROM cms_users WHERE username = $1', [name]);
        if (rows.length) throw new Error(`User '${name}' already exists`);
        const password = await getPassword(options);
        await pool.query(
          'INSERT INTO cms_users (username, display_name, role, password_hash) VALUES ($1, $2, $3, $4)',
          [name, String(options.name ?? '').slice(0, 80), role, await hashPassword(password)]
        );
        console.log(`Created ${role} '${name}'`);
        return;
      }
      case 'set-password': {
        const name = username(arg);
        const password = await getPassword(options);
        const { rows } = await pool.query(
          'UPDATE cms_users SET password_hash = $2 WHERE username = $1 RETURNING id',
          [name, await hashPassword(password)]
        );
        if (!rows.length) throw new Error(`No user '${name}'`);
        await pool.query('DELETE FROM cms_sessions WHERE user_id = $1', [rows[0].id]);
        console.log(`Password updated for '${name}' (all sessions signed out)`);
        return;
      }
      case 'enable-user':
      case 'disable-user': {
        const name = username(arg);
        const active = command === 'enable-user';
        const { rows } = await pool.query(
          'UPDATE cms_users SET is_active = $2 WHERE username = $1 RETURNING id',
          [name, active]
        );
        if (!rows.length) throw new Error(`No user '${name}'`);
        if (!active) await pool.query('DELETE FROM cms_sessions WHERE user_id = $1', [rows[0].id]);
        console.log(`${active ? 'Enabled' : 'Disabled'} '${name}'`);
        return;
      }
      case 'list-users': {
        const { rows } = await pool.query(
          'SELECT username, display_name, role, is_active, last_login_at FROM cms_users ORDER BY username'
        );
        if (!rows.length) {
          console.log('No users. Create one with: node cli.js create-user admin --role admin');
          return;
        }
        for (const row of rows) {
          const last = row.last_login_at ? new Date(row.last_login_at).toISOString().slice(0, 16).replace('T', ' ') : 'never';
          console.log(`${row.username.padEnd(20)} ${row.role.padEnd(7)} ${row.is_active ? 'active  ' : 'disabled'} last login: ${last}${row.display_name ? `  (${row.display_name})` : ''}`);
        }
        return;
      }
      case 'count-users': {
        const { rows } = await pool.query('SELECT count(*) AS n FROM cms_users');
        console.log(String(rows[0].n));
        return;
      }
      default:
        console.log(USAGE);
        process.exitCode = 2;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
