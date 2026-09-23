import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAnnouncement, validateQrLink, validateLocation, validateGeneralSettings, safeQrUrl
} from '../validation.js';

const errorsOf = (fn) => {
  try {
    fn();
  } catch (error) {
    return error.extra?.errors ?? null;
  }
  return null;
};

test('announcement: defaults and column mapping', () => {
  const data = validateAnnouncement({ title: ' Hello ', content: 'Body', date: '2026-01-02' });
  assert.deepEqual(data, {
    title: 'Hello', content: 'Body', type: 'info', date: '2026-01-02', priority: 'medium',
    image_id: null, published: true, expires_on: null
  });
});

test('announcement: reports every bad field at once', () => {
  const errors = errorsOf(() => validateAnnouncement({ content: '', type: 'nope', date: '2026-13-40', imageId: 'abc' }));
  assert.deepEqual(Object.keys(errors).sort(), ['content', 'date', 'imageId', 'title', 'type']);
});

test('announcement: partial update only touches sent fields', () => {
  assert.deepEqual(validateAnnouncement({ published: false }, { partial: true }), { published: false });
  assert.deepEqual(validateAnnouncement({ expiresOn: '' }, { partial: true }), { expires_on: null });
});

test('qr link: https only and host allowlist', () => {
  assert.ok(errorsOf(() => validateQrLink({ name: 'x', url: 'http://example.com' })).url);
  assert.ok(errorsOf(() => validateQrLink({ name: 'x', url: 'javascript:alert(1)' })).url);
  assert.ok(errorsOf(() => validateQrLink({ name: 'x', url: 'https://evil.com' }, { allowedHosts: ['nust.na'] })).url);
  const ok = validateQrLink({ name: 'x', url: 'https://library.nust.na/a' }, { allowedHosts: ['nust.na'] });
  assert.equal(ok.url, 'https://library.nust.na/a');
});

test('safeQrUrl', () => {
  assert.equal(safeQrUrl('not a url'), null);
  assert.equal(safeQrUrl('https://a.b/c').href, 'https://a.b/c');
  assert.equal(safeQrUrl('https://a.b/c', ['x.y']), null);
});

test('location: coordinates clamp to two decimals and bounds', () => {
  const data = validateLocation({ floorId: '3', name: 'Desk', x: '12.345', y: 99.999 });
  assert.equal(data.floor_id, 3);
  assert.equal(data.x_position, 12.35);
  assert.equal(data.y_position, 100);
  assert.ok(errorsOf(() => validateLocation({ floorId: 1, name: 'Desk', x: 101, y: -1 })).x);
});

test('general settings: idle timeout bounds', () => {
  assert.ok(errorsOf(() => validateGeneralSettings({ idleTimeout: 1000, autoResetHome: true })).idleTimeout);
  assert.deepEqual(validateGeneralSettings({ idleTimeout: 120000, autoResetHome: false }), { idleTimeout: 120000, autoResetHome: false });
});
