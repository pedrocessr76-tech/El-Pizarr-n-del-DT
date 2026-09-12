import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { isValidShiftDuration, isStaffRole, canChangeBookingStatus } = require('../dist/apps/server/src/b2b/domain-policy.js');

assert.equal(isValidShiftDuration(1), true);
assert.equal(isValidShiftDuration(2), true);
assert.equal(isValidShiftDuration(90), false);
assert.equal(isStaffRole('ADMIN'), true);
assert.equal(isStaffRole('CLIENT'), false);
assert.equal(canChangeBookingStatus('PENDING', 'CONFIRMED', true), true);
assert.equal(canChangeBookingStatus('PENDING', 'CONFIRMED', false), false);
assert.equal(canChangeBookingStatus('CANCELLED', 'CONFIRMED', true), false);
assert.equal(canChangeBookingStatus('CONFIRMED', 'CANCELLED', false), true);

console.log(JSON.stringify({ ok: true, suite: 'b2b-domain-policy', assertions: 9 }, null, 2));