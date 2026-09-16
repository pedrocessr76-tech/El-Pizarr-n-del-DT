#!/usr/bin/env node
/**
 * Smoke test E2E del backend B2B (Sistema Canchas).
 *
 * Cubre las tres áreas pedidas en las OpenSpec (tasks 4.3 / task 8.10):
 *   1. Autorización: 401 sin token, 403 con rol insuficiente, aislamiento por rol.
 *   2. Disponibilidad: reglas de turnos, generación de turnos y liberación al cancelar.
 *   3. Transacciones de reservas: crear, confirmar, reprogramar, completar, cancelar.
 *
 * ⚠ ESCRIBE DATOS: crea una organización temporal, su cliente, un complejo, una
 * cancha y reservas. Usalo contra un entorno de pruebas, nunca contra producción.
 *
 * Uso (desde apps/server):
 *   npm run test:b2b
 *   B2B_API_URL=https://api-de-pruebas.midominio.com npm run test:b2b
 *
 * Requiere un servidor ya levantado (`npm run start:dev`) apuntando a una base B2B.
 * El script se autoabastece: registra una organización con slug único
 * (`smoke-<timestamp>`) y su propio cliente, así no depende de B2B_SEED ni toca
 * los datos del complejo demo. Al terminar archiva el complejo creado.
 *
 * Nota de zona horaria: los turnos se generan por día de la semana, por lo que el
 * servidor y este script deben compartir zona horaria (caso normal: misma máquina).
 * Si el servidor corre en Docker con TZ=UTC, la cantidad de turnos generados puede
 * variar en ±1; las aserciones están escritas para tolerarlo.
 */

const BASE_URL = (process.env.B2B_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
const UNIQUE = Date.now().toString(36);
const SLUG = 'smoke-' + UNIQUE;
const OWNER_EMAIL = 'owner+' + UNIQUE + '@smoke.test';
const CLIENT_EMAIL = 'cliente+' + UNIQUE + '@smoke.test';
const PASSWORD = 'smoke-password-2026';

let passed = 0;
const failures = [];

function ok(name) {
  passed += 1;
  console.log('  \u2713 ' + name);
}

function fail(name, detail) {
  failures.push({ name, detail });
  console.log('  \u2717 ' + name + (detail ? ' -> ' + detail : ''));
}

function check(name, condition, detail) {
  if (condition) ok(name);
  else fail(name, detail);
}

function section(title) {
  console.log('\n' + title);
}

async function api(method, path, options = {}) {
  const headers = { 'content-type': 'application/json' };
  if (options.token) headers.authorization = 'Bearer ' + options.token;
  const response = await fetch(BASE_URL + path, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  return { status: response.status, data };
}

function expectStatus(name, response, expected) {
  const matches = response.status === expected;
  check(
    name + ' -> ' + expected,
    matches,
    'recibido ' + response.status + ': ' + JSON.stringify(response.data).slice(0, 160),
  );
  return matches;
}

/** Fecha local a N días de hoy (evita líos de UTC en los bordes del día). */
function localDate(daysFromToday, hour) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function finish() {
  console.log('\n' + '-'.repeat(64));
  if (failures.length === 0) {
    console.log('SMOKE TEST OK  \u2014  ' + passed + ' verificaciones pasaron');
    process.exit(0);
  }
  console.log('SMOKE TEST FALL\u00d3  \u2014  ' + passed + ' ok / ' + failures.length + ' fallos');
  for (const failure of failures) {
    console.log('  \u2717 ' + failure.name + (failure.detail ? ': ' + failure.detail : ''));
  }
  process.exit(1);
}

async function main() {
  console.log('Smoke test B2B -> ' + BASE_URL);

  /* ---------- 0) Conectividad ---------- */
  section('0) Conectividad');
  let probe;
  try {
    probe = await api('GET', '/api/v1/auth/organizations');
  } catch (error) {
    console.error('\nNo se pudo conectar a ' + BASE_URL + ' (' + (error?.cause?.code || error?.message) + ')');
    console.error('Levantá el servidor antes de correr el smoke test:');
    console.error('  1) cd apps/server && npm run start:dev');
    console.error('  2) B2B_API_URL=https://tu-api npm run test:b2b');
    process.exit(2);
  }
  expectStatus('GET /api/v1/auth/organizations (público)', probe, 200);
  check('devuelve un array de complejos', Array.isArray(probe.data), JSON.stringify(probe.data).slice(0, 120));

  // Verificación de solo lectura del complejo demo (B2B_SEED=true). Si el seed no
  // está activo, el script continúa: se autoabastece con su propia organización.
  const seeded = Array.isArray(probe.data) ? probe.data.find((org) => org.slug === 'complejo-la-cancha') : undefined;
  if (seeded) {
    const seededCourts = await api('GET', '/api/v1/auth/organizations/' + seeded.id + '/courts');
    if (expectStatus('GET /api/v1/auth/organizations/:id/courts (complejo demo)', seededCourts, 200)) {
      check('el complejo demo expone sus canchas', Array.isArray(seededCourts.data) && seededCourts.data.length >= 3, 'n=' + seededCourts.data?.length);
    }
  } else {
    console.log('  (seed demo no detectado: se omite la verificación de solo lectura del complejo de ejemplo)');
  }

  /* ---------- 1) Registro y login ---------- */
  section('1) Registro y login de organización');
  const registered = await api('POST', '/api/v1/auth/register', {
    body: {
      organizationName: 'Smoke Test Complejo',
      slug: SLUG,
      email: OWNER_EMAIL,
      fullName: 'Owner Smoke',
      password: PASSWORD,
    },
  });
  if (!expectStatus('POST /api/v1/auth/register', registered, 201)) return finish();
  const ownerToken = registered.data.accessToken;
  check('register devuelve accessToken', Boolean(ownerToken));
  check('register asigna el rol OWNER', registered.data.user?.roles?.includes('OWNER'), JSON.stringify(registered.data.user?.roles));

  const duplicateSlug = await api('POST', '/api/v1/auth/register', {
    body: {
      organizationName: 'Complejo duplicado',
      slug: SLUG,
      email: 'otro+' + UNIQUE + '@smoke.test',
      fullName: 'Otro',
      password: PASSWORD,
    },
  });
  expectStatus('registrar un slug duplicado falla', duplicateSlug, 409);

  const login = await api('POST', '/api/v1/auth/login', { body: { email: OWNER_EMAIL, password: PASSWORD } });
  if (!expectStatus('POST /api/v1/auth/login', login, 201)) return finish();
  check('login devuelve accessToken', Boolean(login.data.accessToken));

  const badLogin = await api('POST', '/api/v1/auth/login', { body: { email: OWNER_EMAIL, password: 'password-incorrecta' } });
  expectStatus('login con password incorrecta falla', badLogin, 401);

  /* ---------- 2) Autorización ---------- */
  section('2) Autorización');
  expectStatus('GET /api/v1/auth/me sin token', await api('GET', '/api/v1/auth/me'), 401);
  expectStatus('GET /api/v1/facilities sin token', await api('GET', '/api/v1/facilities'), 401);
  expectStatus('GET /api/v1/bookings con token inválido', await api('GET', '/api/v1/bookings', { token: 'no-es-un-jwt' }), 401);

  const meOwner = await api('GET', '/api/v1/auth/me', { token: ownerToken });
  if (expectStatus('GET /api/v1/auth/me con token OWNER', meOwner, 200)) {
    check('el token identifica al OWNER', meOwner.data.roles?.includes('OWNER'), JSON.stringify(meOwner.data.roles));
  }

  const clientRegister = await api('POST', '/api/v1/auth/register-client', {
    body: {
      email: CLIENT_EMAIL,
      fullName: 'Cliente Smoke',
      password: PASSWORD,
      organizationId: meOwner.data.organizationId,
    },
  });
  if (!expectStatus('POST /api/v1/auth/register-client', clientRegister, 201)) return finish();
  const clientToken = clientRegister.data.accessToken;
  check('register-client asigna el rol CLIENT', clientRegister.data.user?.roles?.includes('CLIENT'), JSON.stringify(clientRegister.data.user?.roles));
  check(
    'el cliente queda en la organización del complejo',
    clientRegister.data.user?.organizationId === meOwner.data.organizationId,
    clientRegister.data.user?.organizationId,
  );

  expectStatus(
    'CLIENT no puede crear complejos',
    await api('POST', '/api/v1/facilities', { token: clientToken, body: { name: 'Complejo pirata' } }),
    403,
  );
  expectStatus('CLIENT no puede ver métricas', await api('GET', '/api/v1/metrics/summary', { token: clientToken }), 403);
  expectStatus(
    'CLIENT no puede crear canchas',
    await api('POST', '/api/v1/facilities/00000000-0000-0000-0000-000000000000/courts', {
      token: clientToken,
      body: { name: 'Cancha pirata', defaultPriceCentsArs: 100 },
    }),
    403,
  );

  /* ---------- 3) Disponibilidad ---------- */
  section('3) Disponibilidad y generación de turnos');
  const facility = await api('POST', '/api/v1/facilities', {
    token: ownerToken,
    body: { name: 'Sede Smoke', address: 'Av. Test 123' },
  });
  if (!expectStatus('POST /api/v1/facilities (OWNER)', facility, 201)) return finish();
  const facilityId = facility.data.id;

  const court = await api('POST', '/api/v1/facilities/' + facilityId + '/courts', {
    token: ownerToken,
    body: { name: 'Cancha Smoke', sportType: 'FUTBOL 5', capacity: 10, defaultPriceCentsArs: 1500000 },
  });
  if (!expectStatus('POST /api/v1/facilities/:id/courts', court, 201)) return finish();
  const courtId = court.data.id;

  expectStatus(
    'una regla de 3 horas es rechazada (sólo 1 o 2h)',
    await api('POST', '/api/v1/courts/' + courtId + '/shift-rules', {
      token: ownerToken,
      body: { weekday: 1, startTime: '10:00', endTime: '13:00', durationHours: 3, priceCentsArs: 1500000 },
    }),
    400,
  );

  const dayA = localDate(1, 10);
  const dayB = localDate(3, 11);
  expectStatus(
    'crear regla de turnos de 1h',
    await api('POST', '/api/v1/courts/' + courtId + '/shift-rules', {
      token: ownerToken,
      body: { weekday: dayA.getDay(), startTime: '10:00', endTime: '11:00', durationHours: 1, priceCentsArs: 1500000 },
    }),
    201,
  );
  expectStatus(
    'crear segunda regla de turnos de 1h',
    await api('POST', '/api/v1/courts/' + courtId + '/shift-rules', {
      token: ownerToken,
      body: { weekday: dayB.getDay(), startTime: '11:00', endTime: '12:00', durationHours: 1, priceCentsArs: 1600000 },
    }),
    201,
  );

  const rules = await api('GET', '/api/v1/courts/' + courtId + '/shift-rules', { token: ownerToken });
  if (expectStatus('GET /api/v1/courts/:id/shift-rules', rules, 200)) {
    check('lista las 2 reglas creadas', Array.isArray(rules.data) && rules.data.length === 2, 'n=' + rules.data?.length);
  }

  const windowFrom = localDate(0, 0);
  const windowTo = localDate(5, 23);
  const fromIso = windowFrom.toISOString();
  const toIso = windowTo.toISOString();

  const generated = await api('POST', '/api/v1/courts/' + courtId + '/shifts/generate', {
    token: ownerToken,
    body: { from: fromIso, to: toIso },
  });
  if (!expectStatus('POST /api/v1/courts/:id/shifts/generate', generated, 201)) return finish();
  check('genera al menos un turno por regla', Array.isArray(generated.data) && generated.data.length >= 2, 'n=' + generated.data?.length);

  const availabilityPath =
    '/api/v1/availability?courtId=' + courtId + '&from=' + encodeURIComponent(fromIso) + '&to=' + encodeURIComponent(toIso);
  const availability = await api('GET', availabilityPath, { token: ownerToken });
  if (!expectStatus('GET /api/v1/availability', availability, 200)) return finish();
  check('la disponibilidad lista los turnos generados', availability.data.length === generated.data.length, 'n=' + availability.data?.length);
  const totalShifts = availability.data.length;
  const firstShift = availability.data[0];
  const secondShift = availability.data[1];
  check('los turnos vienen ordenados por fecha ascendente', new Date(firstShift.startsAt) <= new Date(secondShift.startsAt));
  check('los turnos nacen con el precio de la regla', typeof firstShift.priceCentsArs === 'number' && firstShift.priceCentsArs > 0, String(firstShift.priceCentsArs));

  const blockedFrom = localDate(2, 9).toISOString();
  const blockedTo = localDate(2, 10).toISOString();
  expectStatus(
    'crear un bloqueo de disponibilidad',
    await api('POST', '/api/v1/courts/' + courtId + '/availability-blocks', {
      token: ownerToken,
      body: { startsAt: blockedFrom, endsAt: blockedTo, reason: 'Mantenimiento smoke' },
    }),
    201,
  );
  expectStatus(
    'un bloqueo con rango invertido es rechazado',
    await api('POST', '/api/v1/courts/' + courtId + '/availability-blocks', {
      token: ownerToken,
      body: { startsAt: blockedTo, endsAt: blockedFrom, reason: 'Rango inválido' },
    }),
    400,
  );

  /* ---------- 4) Reservas ---------- */
  section('4) Transacciones de reservas');
  const booking = await api('POST', '/api/v1/bookings', {
    token: clientToken,
    body: { courtId, shiftId: firstShift.id, notes: 'Reserva smoke' },
  });
  if (!expectStatus('CLIENT crea una reserva', booking, 201)) return finish();
  const bookingId = booking.data.id;
  check('la reserva nace en PENDING', booking.data.status === 'PENDING', booking.data.status);
  check('la reserva copia el precio del turno', booking.data.priceCentsArs === firstShift.priceCentsArs, String(booking.data.priceCentsArs));

  expectStatus(
    'no se puede reservar dos veces el mismo turno',
    await api('POST', '/api/v1/bookings', { token: clientToken, body: { courtId, shiftId: firstShift.id } }),
    409,
  );

  const availabilityAfterBooking = await api('GET', availabilityPath, { token: ownerToken });
  check(
    'el turno reservado sale de la disponibilidad',
    availabilityAfterBooking.data.length === totalShifts - 1,
    'n=' + availabilityAfterBooking.data?.length,
  );

  expectStatus(
    'CLIENT no puede confirmar su propia reserva',
    await api('POST', '/api/v1/bookings/' + bookingId + '/confirm', { token: clientToken }),
    403,
  );

  const ownerConfirms = await api('POST', '/api/v1/bookings/' + bookingId + '/confirm', { token: ownerToken });
  if (expectStatus('OWNER confirma la reserva', ownerConfirms, 201)) {
    check('la reserva pasa a CONFIRMED', ownerConfirms.data.status === 'CONFIRMED', ownerConfirms.data.status);
  }

  const reschedule = await api('POST', '/api/v1/bookings/' + bookingId + '/reschedule', {
    token: clientToken,
    body: { shiftId: secondShift.id },
  });
  if (expectStatus('CLIENT reprograma su reserva a otro turno', reschedule, 201)) {
    check('la reserva apunta al nuevo turno', reschedule.data.shiftId === secondShift.id, reschedule.data.shiftId);
  }
  const availabilityAfterReschedule = await api('GET', availabilityPath, { token: ownerToken });
  check(
    'reprogramar libera el turno original',
    availabilityAfterReschedule.data.some((shift) => shift.id === firstShift.id),
    'n=' + availabilityAfterReschedule.data?.length,
  );
  check(
    'el turno nuevo queda ocupado',
    !availabilityAfterReschedule.data.some((shift) => shift.id === secondShift.id),
    'n=' + availabilityAfterReschedule.data?.length,
  );

  const ownerCompletes = await api('POST', '/api/v1/bookings/' + bookingId + '/complete', { token: ownerToken });
  if (expectStatus('OWNER completa la reserva', ownerCompletes, 201)) {
    check('la reserva pasa a COMPLETED', ownerCompletes.data.status === 'COMPLETED', ownerCompletes.data.status);
  }
  expectStatus(
    'no se puede cancelar una reserva COMPLETED (estado terminal)',
    await api('POST', '/api/v1/bookings/' + bookingId + '/cancel', { token: ownerToken }),
    403,
  );

  const cancellable = await api('POST', '/api/v1/bookings', {
    token: clientToken,
    body: { courtId, shiftId: firstShift.id, notes: 'Para cancelar' },
  });
  if (expectStatus('CLIENT crea una segunda reserva', cancellable, 201)) {
    const cancelled = await api('POST', '/api/v1/bookings/' + cancellable.data.id + '/cancel', { token: clientToken });
    if (expectStatus('CLIENT cancela su propia reserva', cancelled, 201)) {
      check('la reserva pasa a CANCELLED', cancelled.data.status === 'CANCELLED', cancelled.data.status);
    }
    const availabilityAfterCancel = await api('GET', availabilityPath, { token: ownerToken });
    check(
      'cancelar devuelve el turno a la disponibilidad',
      availabilityAfterCancel.data.some((shift) => shift.id === firstShift.id),
      'n=' + availabilityAfterCancel.data?.length,
    );
  }

  const clientBookings = await api('GET', '/api/v1/bookings', { token: clientToken });
  if (expectStatus('CLIENT lista sus reservas', clientBookings, 200)) {
    check(
      'el CLIENT sólo ve reservas propias',
      Array.isArray(clientBookings.data) && clientBookings.data.every((item) => item.clientUserId === clientRegister.data.user.userId),
      'n=' + clientBookings.data?.length,
    );
  }

  const metrics = await api('GET', '/api/v1/metrics/summary', { token: ownerToken });
  if (expectStatus('GET /api/v1/metrics/summary (OWNER)', metrics, 200)) {
    const fields = ['totalShifts', 'occupiedShifts', 'availableShifts', 'pendingBookings', 'confirmedBookings', 'cancelledBookings', 'revenueCentsArs'];
    check('las métricas traen todos los campos esperados', fields.every((field) => field in metrics.data), Object.keys(metrics.data || {}).join(','));
    check('la facturación incluye la reserva completada', metrics.data.revenueCentsArs >= secondShift.priceCentsArs, String(metrics.data.revenueCentsArs));
    check('la reserva completada no queda como confirmada', metrics.data.confirmedBookings === 0, String(metrics.data.confirmedBookings));
  }

  /* ---------- 5) Limpieza ---------- */
  section('5) Limpieza');
  expectStatus(
    'DELETE /api/v1/facilities/:id archiva el complejo de prueba',
    await api('DELETE', '/api/v1/facilities/' + facilityId, { token: ownerToken }),
    200,
  );
  console.log('  (la organización de prueba queda registrada con el slug "' + SLUG + '")');

  return finish();
}

main().catch((error) => {
  console.error('\nSmoke test interrumpido por un error inesperado:');
  console.error(error);
  process.exit(1);
});
