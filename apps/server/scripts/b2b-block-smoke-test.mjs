import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Sólo localhost: crea datos aislados de prueba. No borra datos de otras organizaciones.
const base = 'http://localhost:3001/api/v1';
let token;
let facilityId;
async function api(method, path, body, expected = 200) {
  const response = await fetch(base + path, {
    method, signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${response.status}`);
  return data;
}

try {
  const slug = `block-test-${randomUUID()}`;
  const auth = await api('POST', '/auth/register', {
    organizationName: 'Prueba aislada de bloqueos', slug, email: `${slug}@example.invalid`,
    fullName: 'Test', password: randomUUID(),
  }, 201);
  token = auth.accessToken;
  console.log(`Organización de prueba: ${slug}`);
  const facility = await api('POST', '/facilities', { name: 'Sede de prueba' }, 201);
  facilityId = facility.id;
  const court = await api('POST', `/facilities/${facilityId}/courts`, {
    name: 'Cancha de prueba', defaultPriceCentsArs: 10000,
  }, 201);
  // Reglas todos los días para no depender de la zona horaria del contenedor.
  for (let weekday = 0; weekday < 7; weekday++) {
    await api('POST', `/courts/${court.id}/shift-rules`, {
      weekday, startTime: '10:00', endTime: '11:00', durationHours: 1, priceCentsArs: 10000,
    }, 201);
  }
  const from = new Date(Date.now() + 86400000).toISOString();
  const to = new Date(Date.now() + 4 * 86400000).toISOString();
  const shifts = await api('POST', `/courts/${court.id}/shifts/generate`, { from, to }, 201);
  assert.ok(shifts.length > 0);
  const shift = shifts[0];
  const availability = `/availability?${new URLSearchParams({ courtId: court.id, from, to })}`;
  assert.ok((await api('GET', availability)).some((row) => row.id === shift.id));
  await api('POST', `/courts/${court.id}/availability-blocks`, {
    startsAt: shift.startsAt, endsAt: shift.endsAt, reason: 'Prueba de bloqueo',
  }, 201);
  assert.ok(!(await api('GET', availability)).some((row) => row.id === shift.id));
  await api('POST', '/bookings', { courtId: court.id, shiftId: shift.id }, 409);
  assert.deepEqual(await api('GET', '/bookings'), []);
  console.log('OK: turno generado, bloqueo aplicado, disponibilidad filtrada y reserva rechazada con HTTP 409. Sin reservas persistidas.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (facilityId) {
    try {
      await api('DELETE', `/facilities/${facilityId}`);
      console.log('Sede de prueba archivada. Organización, cancha, reglas y turnos permanecen para inspección.');
    } catch (error) {
      console.error('No se pudo archivar la sede:', error);
      process.exitCode = 1;
    }
  }
}
