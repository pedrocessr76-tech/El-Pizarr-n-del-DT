import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Trash2 } from 'lucide-react';
import './ScheduleSettings.css';
import { b2bService, type B2bShiftRule } from '../../services/b2bService';
import { useB2bStore } from '../../store/useB2bStore';
import { orgLocalDateTimeToDate, orgTzLabel, resolveOrgTimeZone } from '../../utils/orgTime';

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function ScheduleSettings({ courts }: { courts: Array<{ id: string; name: string }> }) {
  // Issue #24: el datetime-local y los turnos se interpretan en la zona del complejo.
  const orgTimezone = useB2bStore((state) => state.orgTimezone);
  const timezone = resolveOrgTimeZone(orgTimezone);
  const [courtId, setCourtId] = useState('');
  const [selectedWeekday, setSelectedWeekday] = useState(1);
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

  const submit = async (event: FormEvent<HTMLFormElement>, kind: 'rule' | 'block') => {
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
        await b2bService.createShiftRule(selectedCourt, { weekday: selectedWeekday, startTime, endTime, durationHours, priceCentsArs });
        setMessage('Turno agregado. Generá el mes completo para aplicar los cambios.');
        setRefresh((value) => value + 1);
      } else {
        // datetime-local es el reloj de pared del complejo (#24).
        const from = orgLocalDateTimeToDate(timezone, text('from'));
        const to = orgLocalDateTimeToDate(timezone, text('to'));
        if (!Number.isFinite(from.valueOf()) || !Number.isFinite(to.valueOf()) || from >= to) throw new Error('Ingresá un rango de fechas válido.');
        const reason = text('reason').trim();
        if (!reason) throw new Error('Ingresá el motivo del bloqueo.');
        await b2bService.createAvailabilityBlock(selectedCourt, { startsAt: from.toISOString(), endsAt: to.toISOString(), reason });
        setMessage('Bloqueo registrado.');
      }
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error && !('isAxiosError' in cause) ? cause.message : 'No se pudo guardar. Revisá permisos, datos y posibles duplicados.');
    } finally { setBusy(false); }
  };

  const generateMonth = async () => {
    if (busy || !selectedCourt) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const shifts = await b2bService.generateMonthlyShifts(selectedCourt);
      setMessage(`${shifts.length} turnos nuevos generados. La disponibilidad del mes quedó sincronizada con las reglas.`);
    } catch {
      setError('No se pudieron generar los turnos del mes. Revisá las reglas y volvé a intentar.');
    } finally {
      setBusy(false);
    }
  };

  const removeRule = async (rule: B2bShiftRule) => {
    if (busy || !selectedCourt) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await b2bService.deleteShiftRule(selectedCourt, rule.id);
      setMessage('Turno eliminado de la regla. Generá el mes completo para actualizar la disponibilidad.');
      setRefresh((value) => value + 1);
    } catch {
      setError('No se pudo eliminar el turno. Volvé a cargar las reglas e intentá otra vez.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="panel settings-panel">
    <h2>Horarios y bloqueos</h2>
    <p>Una regla por turno de 1 o 2 horas. Todos los horarios se interpretan en la zona del complejo: <strong>{orgTzLabel(timezone)}</strong>.</p>
    <label>Cancha<select className="b2b-input" value={selectedCourt} disabled={busy} onChange={(event) => { setCourtId(event.target.value); setMessage(''); }}>
      {!courts.length && <option value="">Creá una cancha primero</option>}
      {courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
    </select></label>
    {message && <p role="status" className="settings-feedback">{message}</p>}
    {error && <p role="alert">{error} <button className="secondary-action" disabled={busy} onClick={() => setRefresh((value) => value + 1)}>Recargar reglas</button></p>}
    <label>Día a modificar<select className="b2b-input" value={selectedWeekday} disabled={busy} onChange={(event) => setSelectedWeekday(Number(event.target.value))}>{weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
    {loading ? <p role="status">Cargando reglas…</p> : <div className="settings-list">{rules.filter((rule) => rule.weekday === selectedWeekday).length === 0 ? <p>Sin turnos para {weekdays[selectedWeekday].toLowerCase()}.</p> : rules.filter((rule) => rule.weekday === selectedWeekday).map((rule) => <div className="settings-rule-row" key={rule.id}><span>{rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)} · {rule.durationHours} h · ${(rule.priceCentsArs / 100).toLocaleString('es-AR')} ARS</span><button type="button" className="icon-action" aria-label={`Eliminar turno ${rule.startTime.slice(0, 5)} del ${weekdays[selectedWeekday]}`} title="Eliminar turno" disabled={busy} onClick={() => void removeRule(rule)}><Trash2 size={16} /></button></div>)}</div>}
    <fieldset disabled={busy || !selectedCourt} className="b2b-schedule-forms">
      <form onSubmit={(event) => void submit(event, 'rule')}>
        <h3>Agregar turno</h3>
        <label>Desde<input name="startTime" type="time" className="b2b-input" required /></label>
        <label>Hasta<input name="endTime" type="time" className="b2b-input" required /></label>
        <label>Duración<select name="duration" className="b2b-input"><option value="1">1 hora</option><option value="2">2 horas</option></select></label>
        <label>Precio ARS<input name="price" type="number" min="0.01" step="0.01" className="b2b-input" required /></label>
        <button className="primary-action" type="submit">Guardar regla</button>
      </form>
      <div className="schedule-month-action"><h3>Disponibilidad del mes</h3><p>Genera todos los turnos del mes actual, incluido hoy, según las reglas de esta cancha.</p><button className="primary-action" type="button" onClick={() => void generateMonth()}><CalendarDays size={16} />{busy ? 'Generando…' : 'Generar turnos del mes completo'}</button></div>
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
