import { useEffect, useState, type FormEvent } from 'react';
import './ScheduleSettings.css';
import { b2bService, type B2bShiftRule } from '../../services/b2bService';

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function ScheduleSettings({ courts }: { courts: Array<{ id: string; name: string }> }) {
  const [courtId, setCourtId] = useState('');
  const [rules, setRules] = useState<B2bShiftRule[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selectedCourt = courtId || courts[0]?.id || '';
  useEffect(() => {
    let active = true;
    setRules([]);
    setError('');
    if (!selectedCourt) return;
    setLoading(true);
    b2bService.getShiftRules(selectedCourt).then((items) => {
      if (active) setRules(items);
    }).catch(() => { if (active) setError('No se pudieron cargar las reglas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedCourt, refresh]);

  const submit = async (event: FormEvent<HTMLFormElement>, kind: 'rule' | 'block' | 'generate') => {
    event.preventDefault();
    if (busy || !selectedCourt) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) || '');
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (kind === 'rule') {
        const startTime = text('startTime');
        const endTime = text('endTime');
        const durationHours = Number(text('duration')) as 1 | 2;
        const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
        if (minutes(endTime) - minutes(startTime) !== durationHours * 60) {
          throw new Error('La regla debe abarcar exactamente la duración seleccionada (1 o 2 horas).');
        }
        const priceCentsArs = Math.round(Number(text('price')) * 100);
        if (!Number.isSafeInteger(priceCentsArs) || priceCentsArs <= 0) throw new Error('Ingresá un precio válido.');
        await b2bService.createShiftRule(selectedCourt, { weekday: Number(text('weekday')), startTime, endTime, durationHours, priceCentsArs });
        setMessage('Regla creada. Generá los turnos para publicarla en disponibilidad.');
        setRefresh((value) => value + 1);
      } else {
        // datetime-local se interpreta en la zona del navegador y se envía como ISO UTC.
        const from = new Date(text('from'));
        const to = new Date(text('to'));
        if (!Number.isFinite(from.valueOf()) || !Number.isFinite(to.valueOf()) || from >= to) throw new Error('Ingresá un rango de fechas válido.');
        if (kind === 'block') {
          const reason = text('reason').trim();
          if (!reason) throw new Error('Ingresá el motivo del bloqueo.');
          await b2bService.createAvailabilityBlock(selectedCourt, { startsAt: from.toISOString(), endsAt: to.toISOString(), reason });
          setMessage('Bloqueo registrado.');
        } else {
          if (to.valueOf() - from.valueOf() > 31 * 86400000) throw new Error('Generá como máximo 31 días por operación.');
          const shifts = await b2bService.generateShifts(selectedCourt, from.toISOString(), to.toISOString());
          setMessage(`${shifts.length} turnos generados.`);
        }
      }
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error && !('isAxiosError' in cause) ? cause.message : 'No se pudo guardar. Revisá permisos, datos y posibles duplicados.');
    } finally { setBusy(false); }
  };

  return <section className="panel settings-panel">
    <h2>Horarios y bloqueos</h2>
    <p>Una regla por turno de 1 o 2 horas. Horarios de reglas: zona del servidor. Fechas de bloqueos y generación: {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
    <label>Cancha<select className="b2b-input" value={selectedCourt} disabled={busy} onChange={(event) => { setCourtId(event.target.value); setMessage(''); }}>
      {!courts.length && <option value="">Creá una cancha primero</option>}
      {courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
    </select></label>
    {message && <p role="status" className="settings-feedback">{message}</p>}
    {error && <p role="alert">{error} <button className="secondary-action" disabled={busy} onClick={() => setRefresh((value) => value + 1)}>Recargar reglas</button></p>}
    {loading ? <p role="status">Cargando reglas…</p> : <div className="settings-list">{rules.length === 0 ? <p>Sin reglas cargadas.</p> : rules.map((rule) => <div className="settings-row" key={rule.id}><span>{weekdays[rule.weekday]} {rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)} · {rule.durationHours} h · ${(rule.priceCentsArs / 100).toLocaleString('es-AR')} ARS · {rule.active ? 'Activa' : 'Inactiva'}</span></div>)}</div>}
    <fieldset disabled={busy || !selectedCourt} className="b2b-schedule-forms">
      <form onSubmit={(event) => void submit(event, 'rule')}>
        <h3>Nueva regla</h3>
        <label>Día<select name="weekday" className="b2b-input">{weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
        <label>Desde<input name="startTime" type="time" className="b2b-input" required /></label>
        <label>Hasta<input name="endTime" type="time" className="b2b-input" required /></label>
        <label>Duración<select name="duration" className="b2b-input"><option value="1">1 hora</option><option value="2">2 horas</option></select></label>
        <label>Precio ARS<input name="price" type="number" min="0.01" step="0.01" className="b2b-input" required /></label>
        <button className="primary-action" type="submit">Guardar regla</button>
      </form>
      <form onSubmit={(event) => void submit(event, 'generate')}>
        <h3>Generar turnos</h3>
        <p>Publica las reglas en el período elegido (máximo 31 días).</p>
        <label>Desde<input name="from" type="datetime-local" className="b2b-input" required /></label>
        <label>Hasta<input name="to" type="datetime-local" className="b2b-input" required /></label>
        <button className="primary-action" type="submit">Generar turnos</button>
      </form>
      <form onSubmit={(event) => void submit(event, 'block')}>
        <h3>Bloquear disponibilidad</h3>
        <p>Impide nuevas reservas en el intervalo. No cancela reservas existentes.</p>
        <label>Desde<input name="from" type="datetime-local" className="b2b-input" required /></label>
        <label>Hasta<input name="to" type="datetime-local" className="b2b-input" required /></label>
        <label>Motivo<input name="reason" maxLength={240} className="b2b-input" required /></label>
        <button className="primary-action" type="submit">Guardar bloqueo</button>
      </form>
    </fieldset>
  </section>;
}
