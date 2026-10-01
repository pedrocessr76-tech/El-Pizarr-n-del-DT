import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, LoaderCircle, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import {
  b2bService,
  buildWhatsAppDeepLink,
  type B2bPivotPlayer,
  type B2bPivotProfile,
  type B2bPivotRole,
} from '../../services/b2bService';

const POSITIONS: Array<[string, string]> = [
  ['POR', 'Arquero'],
  ['LD', 'Lateral derecho'],
  ['DFC', 'Defensor central'],
  ['LI', 'Lateral izquierdo'],
  ['MCD', 'Mediocentro defensivo'],
  ['MC', 'Mediocentro'],
  ['MD', 'Volante derecho'],
  ['MI', 'Volante izquierdo'],
  ['MCO', 'Enganche'],
  ['ED', 'Extremo derecho'],
  ['EI', 'Extremo izquierdo'],
  ['SD', 'Segundo delantero'],
  ['DC', 'Delantero'],
];

const ROLE_LABELS: Record<B2bPivotRole, string> = {
  GOALKEEPER: 'Arquero',
  FIELD: 'Jugador de cancha',
  BOTH: 'Ambos roles',
};

const EMPTY_PROFILE: B2bPivotProfile = {
  userId: '',
  fullName: '',
  email: '',
  available: false,
  role: 'FIELD',
  positions: [],
};

function positionLabel(key: string): string {
  return POSITIONS.find(([code]) => code === key)?.[1] ?? key;
}

function messageOf(error: unknown, fallback: string): string {
  const reason = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof reason === 'string' && reason ? reason : fallback;
}

/**
 * Jugador pivote del Sistema Canchas: el jugador marca su disponibilidad y las
 * posiciones que cubre, y el resto del complejo lo busca por posición para
 * completar un partido. El contacto llega como notificación en la app y, si el
 * destinatario autorizó WhatsApp, como deep link al chat.
 */
export function PivotsView({ onBack }: { onBack?: () => void }) {
  const [profile, setProfile] = useState<B2bPivotProfile>(EMPTY_PROFILE);
  const [players, setPlayers] = useState<B2bPivotPlayer[]>([]);
  const [filterPosition, setFilterPosition] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contacting, setContacting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mine, available] = await Promise.all([
        b2bService.getMyPivotProfile(),
        b2bService.getAvailablePivots(filterPosition || undefined),
      ]);
      setProfile(mine);
      setPlayers(available);
    } catch (cause) {
      setError(messageOf(cause, 'No se pudieron cargar los perfiles pivote.'));
    } finally {
      setLoading(false);
    }
  }, [filterPosition]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (next: B2bPivotProfile) => {
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const updated = await b2bService.updateMyPivotProfile({
        available: next.available,
        role: next.role,
        positions: next.positions,
      });
      setProfile(updated);
      setFeedback('Tu perfil pivote quedó actualizado.');
      await load();
    } catch (cause) {
      setError(messageOf(cause, 'No se pudo guardar tu perfil pivote.'));
    } finally {
      setSaving(false);
    }
  };

  const chooseRole = (role: B2bPivotRole) => {
    setProfile({
      ...profile,
      role,
      positions: role === 'GOALKEEPER' ? ['POR'] : profile.positions.filter((position) => position !== 'POR'),
    });
  };

  const togglePosition = (position: string) => {
    const positions = profile.positions.includes(position)
      ? profile.positions.filter((item) => item !== position)
      : [...profile.positions, position];
    setProfile({ ...profile, positions });
  };

  const contact = async (player: B2bPivotPlayer) => {
    setContacting(player.userId);
    setError('');
    setFeedback('');
    try {
      const result = await b2bService.contactPivot(player.userId, contactNote.trim() || undefined);
      setFeedback(
        result.whatsappPhone
          ? `Solicitud enviada a ${player.fullName}. También podés abrir WhatsApp para coordinar.`
          : `Solicitud enviada a ${player.fullName}. Le llega como notificación en la app.`,
      );
    } catch (cause) {
      setError(messageOf(cause, 'No se pudo enviar la solicitud de contacto.'));
    } finally {
      setContacting(null);
    }
  };

  return (
    <div className="b2b-content client-content">
      {onBack && (
        <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Volver</button>
      )}
      <div className="b2b-page-heading compact">
        <div>
          <span className="eyebrow"><i /> JUGADOR PIVOTE</span>
          <h1>Completá tu partido</h1>
          <p>Ofrecete como reemplazo cuando falte alguien, o buscá quién puede sumarse a tu equipo.</p>
        </div>
        <div className="client-chip"><Users size={15} /> Comunidad del complejo</div>
      </div>

      {error && <p className="settings-feedback caveat" role="alert">{error}</p>}
      {feedback && <p className="settings-feedback" role="status">{feedback}</p>}

      <div className="payment-layout">
        <section className="panel settings-panel">
          <div className="settings-panel-head">
            <div>
              <h2>Mi perfil pivote</h2>
              <small>{profile.email || 'Cargando perfil…'}</small>
            </div>
            <span className="settings-icon"><UserRound size={18} /></span>
          </div>

          <label className="wa-optin-row">
            <input
              type="checkbox"
              checked={profile.available}
              onChange={(event) => setProfile({ ...profile, available: event.target.checked })}
            />
            <span>Estoy disponible para reemplazar a un jugador.</span>
          </label>

          <div className="selector-block">
            <label className="field-label">Qué rol podés cubrir</label>
            <div className="duration-toggle">
              {(['GOALKEEPER', 'FIELD', 'BOTH'] as B2bPivotRole[]).map((role) => (
                <button key={role} type="button" className={profile.role === role ? 'active' : ''} onClick={() => chooseRole(role)}>
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          {profile.role !== 'GOALKEEPER' && (
            <div className="selector-block">
              <label className="field-label">Posiciones favoritas</label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.filter(([code]) => code !== 'POR').map(([code, label]) => {
                  const selected = profile.positions.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => togglePosition(code)}
                      className={`min-h-11 px-3 rounded-lg border text-xs font-label-md transition-colors ${
                        selected
                          ? 'bg-[#15803d] text-white border-[#15803d] font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {code} · {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {profile.role !== 'FIELD' && (
            <p className="muted inline-form"><ShieldCheck size={16} className="form-icon" />También podés cubrir el arco.</p>
          )}

          <div className="settings-panel-actions">
            <button className="primary-action" disabled={saving} onClick={() => void save(profile)}>
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} Guardar perfil
            </button>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="settings-panel-head">
            <div>
              <h2>Pivotes disponibles</h2>
              <small>El filtro busca por posición; la solicitud llega como notificación.</small>
            </div>
            <span className="settings-icon"><Users size={18} /></span>
          </div>

          <div className="selector-block">
            <label className="field-label">Posición buscada</label>
            <div className="inline-form">
              <Search size={16} className="form-icon" />
              <select
                className="b2b-input"
                value={filterPosition}
                onChange={(event) => setFilterPosition(event.target.value)}
                aria-label="Filtrar pivotes por posición"
              >
                <option value="">Todas las posiciones</option>
                {POSITIONS.map(([code, label]) => (
                  <option key={code} value={code}>{code} · {label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="selector-block">
            <label className="field-label">Mensaje para el jugador (opcional)</label>
            <textarea
              className="b2b-input"
              maxLength={300}
              value={contactNote}
              onChange={(event) => setContactNote(event.target.value)}
              placeholder="Contale qué puesto necesitan y cuándo juegan…"
            />
          </div>

          {loading && <div className="empty-state">Buscando jugadores disponibles…</div>}
          {!loading && players.length === 0 && (
            <div className="empty-state">No hay pivotes disponibles para ese filtro todavía.</div>
          )}

          <div className="client-bookings-list">
            {players.map((player) => (
              <div className="client-booking-row" key={player.userId}>
                <div>
                  <strong>{player.fullName}</strong>
                  <small>{ROLE_LABELS[player.role]}</small>
                </div>
                <span className="client-booking-when">
                  {player.positions.length === 0
                    ? 'Sin posiciones cargadas'
                    : player.positions.map((position) => positionLabel(position)).join(' · ')}
                </span>
                <div className="client-booking-action">
                  <button
                    className="primary-action"
                    disabled={contacting === player.userId}
                    onClick={() => void contact(player)}
                  >
                    {contacting === player.userId ? 'Enviando…' : 'Contactar'}
                  </button>
                  {player.whatsappPhone && (
                    <a
                      className="secondary-action"
                      href={buildWhatsAppDeepLink(
                        player.whatsappPhone,
                        `Hola ${player.fullName}, te escribo del Sistema Canchas. ${contactNote.trim()}`.trim(),
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
