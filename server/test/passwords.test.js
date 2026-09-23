import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../auth/passwords.js';

test('hash and verify round trip', async () => {
  const hash = await hashPassword('correct horse battery');
  assert.match(hash, /^scrypt\$32768\$8\$1\$/);
  assert.equal(await verifyPassword('correct horse battery', hash), true);
  assert.equal(await verifyPassword('correct horse batterx', hash), false);
});

test('two hashes of the same password differ (random salt)', async () => {
  assert.notEqual(await hashPassword('same-password-1'), await hashPassword('same-password-1'));
});

test('malformed stored hashes never verify', async () => {
  assert.equal(await verifyPassword('x', ''), false);
  assert.equal(await verifyPassword('x', null), false);
  assert.equal(await verifyPassword('x', 'bcrypt$whatever'), false);
  assert.equal(await verifyPassword('x', 'scrypt$1$1$1$$'), false);
});

test('password strength rule', () => {
  assert.match(validatePasswordStrength('short'), /at least 10/);
  assert.equal(validatePasswordStrength('long enough password'), null);
  assert.match(validatePasswordStrength('x'.repeat(201)), /at most/);
});
