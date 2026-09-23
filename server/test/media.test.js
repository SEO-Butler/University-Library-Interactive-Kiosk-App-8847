import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImage } from '../routes/media.js';

test('detects real image signatures only', () => {
  assert.equal(detectImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])).type, 'image/png');
  assert.equal(detectImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])).type, 'image/jpeg');
  assert.equal(detectImage(Buffer.from('GIF89a......')).type, 'image/gif');
  assert.equal(detectImage(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')])).type, 'image/webp');
  assert.equal(detectImage(Buffer.from('<svg onload=alert(1)></svg>')), null);
  assert.equal(detectImage(Buffer.from('%PDF-1.4')), null);
  assert.equal(detectImage('not a buffer'), null);
});
