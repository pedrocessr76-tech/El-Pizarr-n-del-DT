import { useEffect, useState } from 'react';
import { BellRing, Check, Clock3, Mail } from 'lucide-react';
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

const MIN_INTERVAL_MINUTES = 5;
const MAX_INTERVAL_MINUTES = 10080;
const MAX_INTERVALS = 5;

function labelForInterval(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} ${minutes === 1440 ? 'día' : 'días'}`;
  if (minutes % 60 === 0) return `${minutes / 60} ${minutes === 60 ? 'hora' : 'horas'}`;
  return `${minutes} minutos`;
}

function sortIntervals(values: number[] | undefined, fallback: number[]): number[] {
  return Array.isArray(values) ? [...values].sort((a, b) => b - a) : fallback;
}

/** Un selector de anticipaciones para un canal. `empty` es una configuración válida: desactiva el canal. */
function IntervalPicker({
  idPrefix,
  legend,
  hint,
  icon,
  intervals,
  disabled,
  onToggle,
  onAddCustom,
  customMinutes,
  onCustomChange,
  customError,
}: {
  idPrefix: string;
  legend: string;
  hint: string;
  icon: React.ReactNode;
  intervals: number[];
  disabled: boolean;
  onToggle: (minutes: number) => void;
  onAddCustom: () => void;
  customMinutes: string;
  onCustomChange: (value: string) => void;
  customError: string;
}) {
  return <div className="reminder-channel">
    <div className="reminder-channel-heading"><span className="reminder-icon">{icon}</span><div><h3>{legend}</h3><p>{hint}</p></div></div>
    <div className="reminder-presets" aria-label={`Anticipaciones de ${legend.toLowerCase()}`}>
      {presets.map((preset) => <button key={preset.minutes} type="button" disabled={disabled} aria-pressed={intervals.includes(preset.minutes)} className={intervals.includes(preset.minutes) ? 'selected' : ''} onClick={() => onToggle(preset.minutes)}><Clock3 size={14} /> {preset.label}{intervals.includes(preset.minutes) && <Check size={14} />}</button>)}
    </div>
    <div className="reminder-custom-row">
      <label htmlFor={`${idPrefix}-custom-minutes`}>Otra anticipación</label>
      <input id={`${idPrefix}-custom-minutes`} type="number" min={MIN_INTERVAL_MINUTES} max={MAX_INTERVAL_MINUTES} step={5} className="b2b-input" placeholder="Minutos" value={customMinutes} disabled={disabled} onChange={(event) => onCustomChange(event.target.value)} />
      <button type="button" className="secondary-action" disabled={disabled || !customMinutes} onClick={onAddCustom}>Agregar</button>
    </div>
    <p className="reminder-summary">
      {intervals.length > 0
        ? `Se va a avisar ${intervals.map(labelForInterval).join(' y ')} antes del turno.`
        : 'Sin anticipaciones: este canal queda apagado.'}
    </p>
    {customError && <p role="alert" className="settings-feedback caveat">{customError}</p>}
  </div>;
}

export function ReminderSettings() {
  const user = useB2bStore((state) => state.user);
  const canEdit = (user?.roles ?? []).some((role) => ['OWNER', 'ADMIN'].includes(role.toUpperCase()));
  const [emailIntervals, setEmailIntervals] = useState<number[]>([1440]);
  const [whatsappIntervals, setWhatsappIntervals] = useState<number[]>([30]);
  const [emailCustom, setEmailCustom] = useState('');
  const [whatsappCustom, setWhatsappCustom] = useState('');
  const [emailError, setEmailError] = useState('');
  const [whatsappError, setWhatsappError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    b2bService.getOrganization()
      .then((organization) => {
        if (!active) return;
        setEmailIntervals(sortIntervals(organization.emailReminderIntervalsMinutes, [1440]));
        setWhatsappIntervals(sortIntervals(organization.whatsappReminderIntervalsMinutes, [30]));
      })
      .catch(() => { if (active) setError('No se pudo cargar la configuración de recordatorios.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggle = (current: number[], set: (next: number[]) => void, clearError: () => void) => (minutes: number) => {
    clearError();
    setMessage('');
    set(current.includes(minutes)
      ? current.filter((value) => value !== minutes)
      : current.length < MAX_INTERVALS ? [...current, minutes].sort((a, b) => b - a) : current);
  };

  const addCustom = (
    current: number[],
    set: (next: number[]) => void,
    raw: string,
    onRaw: (value: string) => void,
    setErrorFor: (message: string) => void,
  ) => {
    const minutes = Number(raw);
    if (!Number.isInteger(minutes) || minutes < MIN_INTERVAL_MINUTES || minutes > MAX_INTERVAL_MINUTES) {
      setErrorFor(`Ingresá entre ${MIN_INTERVAL_MINUTES} y ${MAX_INTERVAL_MINUTES} minutos.`);
      return;
    }
    if (current.includes(minutes)) {
      setErrorFor('Esa anticipación ya está agregada.');
      return;
    }
    if (current.length >= MAX_INTERVALS) {
      setErrorFor(`Podés configurar hasta ${MAX_INTERVALS} anticipaciones.`);
      return;
    }
    set([...current, minutes].sort((a, b) => b - a));
    onRaw('');
    setErrorFor('');
    setMessage('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const organization = await b2bService.updateOrganizationReminderIntervals({
        emailReminderIntervalsMinutes: emailIntervals,
        whatsappReminderIntervalsMinutes: whatsappIntervals,
      });
      setEmailIntervals(sortIntervals(organization.emailReminderIntervalsMinutes, emailIntervals));
      setWhatsappIntervals(sortIntervals(organization.whatsappReminderIntervalsMinutes, whatsappIntervals));
      setMessage('Anticipaciones guardadas.');
    } catch {
      setError('No se pudo guardar. Verificá tus permisos y las anticipaciones elegidas.');
    } finally {
      setSaving(false);
    }
  };

  const disabled = !canEdit || saving;

  return <section className="panel reminder-settings">
    <div className="reminder-settings-heading"><span className="reminder-icon"><BellRing size={18} /></span><div><h2>Recordatorios automáticos</h2><p>Dos canales con tiempos de reacción distintos (#34).</p></div></div>
    {loading ? <p role="status">Cargando anticipaciones…</p> : <>
      <IntervalPicker
        idPrefix="reminder-email"
        legend="Recordatorio por email"
        hint="El servidor lo manda solo, aunque el dashboard esté cerrado."
        icon={<Mail size={18} />}
        intervals={emailIntervals}
        disabled={disabled}
        onToggle={toggle(emailIntervals, setEmailIntervals, () => setEmailError(''))}
        onAddCustom={() => addCustom(emailIntervals, setEmailIntervals, emailCustom, setEmailCustom, setEmailError)}
        customMinutes={emailCustom}
        onCustomChange={(value) => { setEmailCustom(value); setEmailError(''); }}
        customError={emailError}
      />
      <IntervalPicker
        idPrefix="reminder-whatsapp"
        legend="Aviso de WhatsApp"
        hint="No se manda solo: aparece en Avisos pendientes y lo despacha el personal."
        icon={<BellRing size={18} />}
        intervals={whatsappIntervals}
        disabled={disabled}
        onToggle={toggle(whatsappIntervals, setWhatsappIntervals, () => setWhatsappError(''))}
        onAddCustom={() => addCustom(whatsappIntervals, setWhatsappIntervals, whatsappCustom, setWhatsappCustom, setWhatsappError)}
        customMinutes={whatsappCustom}
        onCustomChange={(value) => { setWhatsappCustom(value); setWhatsappError(''); }}
        customError={whatsappError}
      />
      {!canEdit && <p className="reminder-help">Solo propietarios y administradores pueden cambiar estas anticipaciones.</p>}
      {error && <p role="alert" className="settings-feedback caveat">{error}</p>}
      {message && <p role="status" className="settings-feedback">{message}</p>}
      {canEdit && <button type="button" className="primary-action" disabled={saving || loading} onClick={() => void save()}>{saving ? 'Guardando…' : 'Guardar anticipaciones'}</button>}
    </>}
    <p className="reminder-provider-note">
      El email sale por el SMTP configurado por el complejo; si no hay servidor configurado, los envíos quedan en
      modo simulado y el servidor lo avisa. El aviso de WhatsApp nunca se envía desde el servidor: se arma el
      mensaje y el personal lo manda desde su teléfono con un enlace a <code>wa.me</code>.
    </p>
  </section>;
}