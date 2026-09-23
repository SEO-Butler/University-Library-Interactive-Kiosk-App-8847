import { badRequest } from './lib/errors.js';

export const ANNOUNCEMENT_TYPES = ['info', 'event'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const LOCATION_TYPES = ['entrance', 'service', 'amenity', 'collection', 'technology', 'study'];
export const ROLES = ['admin', 'editor'];
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export const MIN_IDLE_TIMEOUT = 60000;
export const MAX_IDLE_TIMEOUT = 30 * 60000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Each check returns the cleaned value or records an error under the field name.
class Checker {
  constructor(input) {
    this.input = input && typeof input === 'object' ? input : {};
    this.errors = {};
    this.data = {};
  }

  has(field) {
    return Object.prototype.hasOwnProperty.call(this.input, field);
  }

  fail(field, message) {
    this.errors[field] = message;
  }

  text(field, column, { min = 0, max = 1000, required = min > 0, optional = false } = {}) {
    if (optional && !this.has(field)) return;
    const raw = this.input[field];
    if (raw === undefined || raw === null) {
      if (required) this.fail(field, 'Required');
      else this.data[column] = '';
      return;
    }
    if (typeof raw !== 'string') return this.fail(field, 'Must be text');
    const value = raw.trim();
    if (value.length < min) return this.fail(field, min === 1 ? 'Required' : `Must be at least ${min} characters`);
    if (value.length > max) return this.fail(field, `Must be at most ${max} characters`);
    this.data[column] = value;
  }

  oneOf(field, column, options, { fallback, optional = false } = {}) {
    if (optional && !this.has(field)) return;
    const raw = this.input[field];
    if ((raw === undefined || raw === null || raw === '') && fallback !== undefined) {
      this.data[column] = fallback;
      return;
    }
    if (!options.includes(raw)) return this.fail(field, `Must be one of: ${options.join(', ')}`);
    this.data[column] = raw;
  }

  bool(field, column, { fallback = undefined, optional = false } = {}) {
    if (optional && !this.has(field)) return;
    const raw = this.input[field];
    if (raw === undefined || raw === null) {
      if (fallback === undefined) return this.fail(field, 'Required');
      this.data[column] = fallback;
      return;
    }
    if (typeof raw !== 'boolean') return this.fail(field, 'Must be true or false');
    this.data[column] = raw;
  }

  integer(field, column, { min = -2147483648, max = 2147483647, fallback = undefined, optional = false } = {}) {
    if (optional && !this.has(field)) return;
    const raw = this.input[field];
    if (raw === undefined || raw === null || raw === '') {
      if (fallback === undefined) return this.fail(field, 'Required');
      this.data[column] = fallback;
      return;
    }
    const value = typeof raw === 'string' ? Number(raw) : raw;
    if (!Number.isInteger(value)) return this.fail(field, 'Must be a whole number');
    if (value < min || value > max) return this.fail(field, `Must be between ${min} and ${max}`);
    this.data[column] = value;
  }

  number(field, column, { min, max, optional = false } = {}) {
    if (optional && !this.has(field)) return;
    const raw = this.input[field];
    const value = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
    if (typeof value !== 'number' || !Number.isFinite(value)) return this.fail(field, 'Must be a number');
    if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
      return this.fail(field, `Must be between ${min} and ${max}`);
    }
    this.data[column] = Math.round(value * 100) / 100;
  }

  date(field, column, { required = true, optional = false } = {}) {
    if (optional && !this.has(field)) return;
    const raw = this.input[field];
    if (raw === undefined || raw === null || raw === '') {
      if (required) return this.fail(field, 'Required');
      this.data[column] = null;
      return;
    }
    if (typeof raw !== 'string' || !DATE_PATTERN.test(raw) || Number.isNaN(Date.parse(raw))) {
      return this.fail(field, 'Must be a date in YYYY-MM-DD format');
    }
    this.data[column] = raw;
  }

  uuidOrNull(field, column, { optional = false } = {}) {
    if (optional && !this.has(field)) return;
    const raw = this.input[field];
    if (raw === undefined || raw === null || raw === '') {
      this.data[column] = null;
      return;
    }
    if (typeof raw !== 'string' || !UUID_PATTERN.test(raw)) return this.fail(field, 'Must be a valid id');
    this.data[column] = raw.toLowerCase();
  }

  result() {
    if (Object.keys(this.errors).length) {
      throw badRequest('Please correct the highlighted fields', { errors: this.errors });
    }
    return this.data;
  }
}

// Returns a URL object if the link is safe to show as a QR code, otherwise null.
// Rejects non-https schemes (javascript:, data:, http:) and hosts outside the allowlist.
export function safeQrUrl(value, allowedHosts = []) {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (allowedHosts.length === 0) return url;
  const host = url.hostname.toLowerCase();
  return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)) ? url : null;
}

// `partial` validators (PUT) only touch the fields that were sent.
export function validateAnnouncement(input, { partial = false } = {}) {
  const c = new Checker(input);
  const optional = partial;
  c.text('title', 'title', { min: 1, max: 200, optional });
  c.text('content', 'content', { min: 1, max: 5000, optional });
  c.oneOf('type', 'type', ANNOUNCEMENT_TYPES, { fallback: 'info', optional });
  c.date('date', 'date', { optional });
  c.oneOf('priority', 'priority', PRIORITIES, { fallback: 'medium', optional });
  c.uuidOrNull('imageId', 'image_id', { optional });
  c.bool('published', 'published', { fallback: true, optional });
  c.date('expiresOn', 'expires_on', { required: false, optional });
  return c.result();
}

export function validateFaq(input, { partial = false } = {}) {
  const c = new Checker(input);
  const optional = partial;
  c.text('category', 'category', { min: 1, max: 60, optional });
  c.text('question', 'question', { min: 1, max: 300, optional });
  c.text('answer', 'answer', { min: 1, max: 5000, optional });
  c.integer('sortOrder', 'sort_order', { min: -10000, max: 10000, fallback: 0, optional });
  c.bool('published', 'published', { fallback: true, optional });
  return c.result();
}

export function validateQrLink(input, { partial = false, allowedHosts = [] } = {}) {
  const c = new Checker(input);
  const optional = partial;
  c.text('name', 'name', { min: 1, max: 100, optional });
  c.text('url', 'url', { min: 1, max: 2000, optional });
  c.text('description', 'description', { max: 300, optional });
  c.integer('sortOrder', 'sort_order', { min: -10000, max: 10000, fallback: 0, optional });
  c.bool('published', 'published', { fallback: true, optional });
  if (c.data.url !== undefined && !c.errors.url) {
    const url = safeQrUrl(c.data.url, allowedHosts);
    if (!url) {
      const where = allowedHosts.length ? `on ${allowedHosts.join(', ')}` : '';
      c.fail('url', `Must be a valid https:// link ${where}`.trim());
    } else {
      c.data.url = url.href;
    }
  }
  return c.result();
}

export function validateFloor(input, { partial = false } = {}) {
  const c = new Checker(input);
  const optional = partial;
  c.text('name', 'name', { min: 1, max: 100, optional });
  c.integer('sortOrder', 'sort_order', { min: -10000, max: 10000, fallback: 0, optional });
  c.uuidOrNull('mapImageId', 'map_image_id', { optional });
  c.bool('published', 'published', { fallback: true, optional });
  return c.result();
}

export function validateLocation(input, { partial = false } = {}) {
  const c = new Checker(input);
  const optional = partial;
  c.integer('floorId', 'floor_id', { min: 1, optional });
  c.text('name', 'name', { min: 1, max: 100, optional });
  c.oneOf('type', 'type', LOCATION_TYPES, { fallback: 'service', optional });
  c.number('x', 'x_position', { min: 0, max: 100, optional });
  c.number('y', 'y_position', { min: 0, max: 100, optional });
  c.text('directions', 'directions', { max: 1000, optional });
  c.integer('sortOrder', 'sort_order', { min: -10000, max: 10000, fallback: 0, optional });
  return c.result();
}

export function validateGeneralSettings(input) {
  const c = new Checker(input);
  c.integer('idleTimeout', 'idleTimeout', { min: MIN_IDLE_TIMEOUT, max: MAX_IDLE_TIMEOUT, fallback: 300000 });
  c.bool('autoResetHome', 'autoResetHome', { fallback: true });
  return c.result();
}

export function validateSiteSettings(input) {
  const c = new Checker(input);
  c.text('libraryName', 'libraryName', { min: 1, max: 80 });
  c.text('welcomeMessage', 'welcomeMessage', { max: 160 });
  c.text('openingHours', 'openingHours', { max: 80 });
  c.text('wifiNetwork', 'wifiNetwork', { max: 60 });
  c.text('helpDeskName', 'helpDeskName', { max: 60 });
  c.text('helpDeskLocation', 'helpDeskLocation', { max: 80 });
  c.text('helpPhone', 'helpPhone', { max: 60 });
  return c.result();
}

export const SETTINGS_VALIDATORS = {
  general: validateGeneralSettings,
  site: validateSiteSettings
};

export function validateUsername(value) {
  const username = String(value ?? '').trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw badRequest('Please correct the highlighted fields', {
      errors: { username: '3-32 characters: lowercase letters, digits, dot, dash or underscore' }
    });
  }
  return username;
}

export function validateUser(input, { partial = false } = {}) {
  const c = new Checker(input);
  const optional = partial;
  c.text('displayName', 'display_name', { max: 80, optional });
  c.oneOf('role', 'role', ROLES, { fallback: 'editor', optional });
  c.bool('isActive', 'is_active', { fallback: true, optional });
  return c.result();
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw badRequest('Invalid id');
  return id;
}

export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
