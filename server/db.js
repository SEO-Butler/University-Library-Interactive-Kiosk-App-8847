import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'kiosk.db');

let db;

export async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing DB file if it exists, otherwise create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements_kiosk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      date TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS faqs_kiosk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS qr_links_kiosk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS library_floors_kiosk (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS library_locations_kiosk (
      location_id TEXT PRIMARY KEY,
      floor_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      x_position REAL NOT NULL,
      y_position REAL NOT NULL,
      directions TEXT,
      FOREIGN KEY (floor_id) REFERENCES library_floors_kiosk(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS kiosk_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT,
      updated_at TEXT
    )
  `);

  save();
  return db;
}

/** Persist the in-memory database to disk */
export function save() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

/** Get a single row as an object */
export function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

/** Get all rows as an array of objects */
export function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/** Run a statement (INSERT/UPDATE/DELETE) and save to disk. Returns last_insert_rowid. */
export function run(sql, params = []) {
  db.run(sql, params);
  // Capture rowid BEFORE export/save (export resets last_insert_rowid)
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const lastId = stmt.getAsObject().id;
  stmt.free();
  save();
  return lastId;
}

/** Get the count of a table */
export function count(table) {
  return getOne(`SELECT COUNT(*) as c FROM ${table}`).c;
}
