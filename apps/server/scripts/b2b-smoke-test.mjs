import assert from 'node:assert/strict';

const apiUrl = process.env.B2B_SMOKE_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function login(email, password) {
  const { response, body } = await request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 201, `login failed for ${email}`);
  return body;
}

const admin = await login('admin@lacancha.com.ar', 'canchas-demo');
const client = await login('cliente@lacancha.com.ar', 'canchas-client');
const adminHeaders = { authorization: `Bearer ${admin.accessToken}` };
const clientHeaders = { authorization: `Bearer ${client.accessToken}` };

const courtsResult = await request('/api/v1/courts', { headers: adminHeaders });
assert.equal(courtsResult.response.status, 200);
assert.ok(courtsResult.body.length >= 3, 'expected seeded courts');

const court = courtsResult.body[0];
const from = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
const availability = await request(`/api/v1/availability?courtId=${court.id}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, { headers: adminHeaders });
assert.equal(availability.response.status, 200);
assert.ok(availability.body.length > 0, 'expected seeded availability');

const shift = availability.body[0];
const bookingResult = await request('/api/v1/bookings', {
  method: 'POST',
  headers: clientHeaders,
  body: JSON.stringify({ courtId: court.id, shiftId: shift.id, notes: 'Automated B2B smoke test' }),
});
assert.equal(bookingResult.response.status, 201);
assert.equal(bookingResult.body.status, 'PENDING');

const duplicateResult = await request('/api/v1/bookings', {
  method: 'POST',
  headers: clientHeaders,
  body: JSON.stringify({ courtId: court.id, shiftId: shift.id, notes: 'Duplicate smoke test' }),
});
assert.equal(duplicateResult.response.status, 409);

const confirmation = await request(`/api/v1/bookings/${bookingResult.body.id}/confirm`, {
  method: 'POST',
  headers: adminHeaders,
});
assert.equal(confirmation.response.status, 201);
assert.equal(confirmation.body.status, 'CONFIRMED');

const cancellation = await request(`/api/v1/bookings/${bookingResult.body.id}/cancel`, {
  method: 'POST',
  headers: clientHeaders,
});
assert.equal(cancellation.response.status, 201);
assert.equal(cancellation.body.status, 'CANCELLED');

const anonymous = await request('/api/v1/bookings', {
  method: 'POST',
  body: JSON.stringify({ courtId: court.id, shiftId: shift.id }),
});
assert.equal(anonymous.response.status, 401);

console.log(JSON.stringify({
  ok: true,
  courts: courtsResult.body.length,
  availableSlots: availability.body.length,
  duplicateStatus: duplicateResult.response.status,
  confirmedStatus: confirmation.body.status,
  cancelledStatus: cancellation.body.status,
  anonymousStatus: anonymous.response.status,
}, null, 2));
