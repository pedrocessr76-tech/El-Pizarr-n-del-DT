import { useEffect, useState } from 'react';
import { BellRing, Check, Clock3 } from 'lucide-react';
import { b2bService } from '../../services/b2bService';
import { useB2bStore } from '../../store/useB2bStore';

const presets = [
  { minutes: 2880, label: '48 horas' },
  { minutes: 1440, label: '24 horas' },
  { minutes: 720, label: '12 horas' },
  { minutes: 180, label: '3 horas' },
  { minutes: 60, label: '1 hora' },
  { minutes: 30, label: '30 minutos' },
];

function labelForInterval(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} ${minutes === 1440 ? 'día' : 'días'}`;
  if (minutes % 60 === 0) return `${minutes / 60} ${minutes === 60 ? 'hora' : 'horas'}`;
  return `${minutes} minutos`;
}

export function ReminderSettings() {
  const user = useB2bStore((state) => state.user);
  const canEdit = (user?.roles ?? []).some((role) => ['OWNER', 'ADMIN'].includes(role.toUpperCase()));
  const [intervals, setIntervals] = useState<number[]>([1440, 60]);
  const [customMinutes, setCustomMinutes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    b2bService.getOrganization()
      .then((organization) => {
        if (active) setIntervals(organization.whatsappReminderIntervalsMinutes?.length
          ? [...organization.whatsappReminderIntervalsMinutes].sort((a, b) => b - a)
          : [1440, 60]);
      })
      .catch(() => { if (active) setError('No se pudo cargar la configuración de recordatorios.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggleInterval = (minutes: number) => {
    setMessage('');
    setIntervals((current) => current.includes(minutes)
      ? current.filter((value) => value !== minutes)
      : current.length < 5 ? [...current, minutes].sort((a, b) => b - a) : current);
  };

  const addCustomInterval = () => {
    const minutes = Number(customMinutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 10080) {
      setError('Ingresá entre 5 y 10080 minutos.');
      return;
    }
    if (intervals.includes(minutes)) {
      setError('Esa anticipación ya está agregada.');
      return;
    }
    if (intervals.length >= 5) {
      setError('Podés configurar hasta 5 anticipaciones.');
      return;
    }
    setIntervals((current) => [...current, minutes].sort((a, b) => b - a));
    setCustomMinutes('');
    setError('');
    setMessage('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const organization = await b2bService.updateOrganizationReminderIntervals(intervals);
      setIntervals(organization.whatsappReminderIntervalsMinutes ?? intervals);
      setMessage('Anticipaciones guardadas.');
    } catch {
      setError('No se pudo guardar. Verificá tus permisos y las anticipaciones elegidas.');
    } finally {
      setSaving(false);
    }
  };

  return <section className="panel reminder-settings">
    <div className="reminder-settings-heading"><span className="reminder-icon"><BellRing size={18} /></span><div><h2>Recordatorios automáticos</h2><p>WhatsApp a clientes antes del inicio de cada turno.</p></div></div>
    {loading ? <p role="status">Cargando anticipaciones…</p> : <>
      <div className="reminder-presets" aria-label="Anticipaciones antes del turno">
        {presets.map((preset) => <button key={preset.minutes} type="button" disabled={!canEdit || saving} aria-pressed={intervals.includes(preset.minutes)} className={intervals.includes(preset.minutes) ? 'selected' : ''} onClick={() => toggleInterval(preset.minutes)}><Clock3 size={14} /> {preset.label}{intervals.includes(preset.minutes) && <Check size={14} />}</button>)}
      </div>
      <div className="reminder-custom-row"><label htmlFor="reminder-custom-minutes">Otra anticipación</label><input id="reminder-custom-minutes" type="number" min={5} max={10080} step={5} className="b2b-input" placeholder="Minutos" value={customMinutes} disabled={!canEdit || saving} onChange={(event) => setCustomMinutes(event.target.value)} /><button type="button" className="secondary-action" disabled={!canEdit || saving || !customMinutes} onClick={addCustomInterval}>Agregar</button></div>
      {intervals.length > 0 && <p className="reminder-summary">Se enviarán {intervals.map(labelForInterval).join(' y ')} antes del turno.</p>}
      {!canEdit && <p className="reminder-help">Solo propietarios y administradores pueden cambiar estas anticipaciones.</p>}
      {error && <p role="alert" className="settings-feedback caveat">{error}</p>}
      {message && <p role="status" className="settings-feedback">{message}</p>}
      {canEdit && <button type="button" className="primary-action" disabled={saving || loading || intervals.length === 0} onClick={() => void save()}>{saving ? 'Guardando…' : 'Guardar anticipaciones'}</button>}
    </>}
    <p className="reminder-provider-note">El proveedor WhatsApp actual está en modo simulado: el servidor registra los recordatorios, pero todavía no los entrega por WhatsApp.</p>
  </section>;
}
