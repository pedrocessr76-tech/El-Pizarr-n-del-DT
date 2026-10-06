import { useCallback, useEffect, useState } from 'react';
import { Check, MessageCircle, X } from 'lucide-react';
import { b2bService, type B2bPivotRequest } from '../../services/b2bService';
import { formatDayLabel, formatHourLabel } from '../../utils/orgTime';
import './PivotRequestsView.css';

const STATUS_LABEL: Record<B2bPivotRequest['status'], string> = {
  PENDING: 'Esperando respuesta',
  ACCEPTED: 'Va al partido',
  DECLINED: 'No puede asistir',
};

export function PivotRequestsView({ onOpenChat, timezone }: { onOpenChat: (conversationId: string) => void; timezone: string }) {
  const [items, setItems] = useState<B2bPivotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setItems(await b2bService.getPivotRequests()); }
    catch { setError('No se pudieron cargar las solicitudes de pivote.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refreshRequests = () => void load();
    window.addEventListener('b2b-pivot-request-updated', refreshRequests);
    return () => window.removeEventListener('b2b-pivot-request-updated', refreshRequests);
  }, [load]);

  const respond = async (request: B2bPivotRequest, decision: 'ACCEPTED' | 'DECLINED') => {
    setBusyId(request.id);
    setError('');
    setFeedback('');
    try {
      await b2bService.respondToPivotRequest(request.id, decision);
      setFeedback(decision === 'ACCEPTED' ? 'Confirmaste que vas al partido.' : 'Avisaste que no podés asistir.');
      await load();
    } catch {
      setError('No se pudo guardar la respuesta. Actualizá la lista e intentá otra vez.');
    } finally { setBusyId(null); }
  };

  return <div className="b2b-content client-content">
    <div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> JUGADOR PIVOTE</span><h1>Solicitudes de pivote</h1><p>Partidos para los que buscaste o te solicitaron como pivote.</p></div><button className="secondary-action" onClick={() => void load()}>Actualizar</button></div>
    {error && <p className="settings-feedback caveat" role="alert">{error}</p>}
    {feedback && <p className="settings-feedback" role="status">{feedback}</p>}
    {loading ? <section className="panel"><div className="empty-state">Cargando solicitudes…</div></section> : items.length === 0 ? <section className="panel"><div className="empty-state">Todavía no tenés solicitudes de pivote.</div></section> : (
      <section className="panel pivot-request-list">
        {items.map((request) => {
          const name = request.isRequester ? request.pivotName : request.requesterName;
          const statusClass = request.status.toLowerCase();
          return <article className="pivot-request-row" key={request.id}>
            <div className="pivot-request-match">
              <span className="settings-icon"><MessageCircle size={17} /></span>
              <div><strong>{request.isRequester ? `Solicitaste a ${name}` : `${name} te solicita para el partido`}</strong>
                <small>{request.courtName} · {request.courtSportType}</small>
                <small>{formatDayLabel(timezone, request.shiftStartsAt)} · {formatHourLabel(timezone, request.shiftStartsAt)}–{formatHourLabel(timezone, request.shiftEndsAt)}</small>
              </div>
            </div>
            <span className={`pivot-request-status ${statusClass}`}>{STATUS_LABEL[request.status]}</span>
            <div className="pivot-request-actions">
              {request.canRespond && <>
                <button className="primary-action" disabled={busyId === request.id} onClick={() => void respond(request, 'ACCEPTED')}><Check size={15} /> Voy</button>
                <button className="secondary-action" disabled={busyId === request.id} onClick={() => void respond(request, 'DECLINED')}><X size={15} /> No voy</button>
              </>}
              <button className="icon-button" aria-label={`Abrir chat con ${name}`} title="Abrir chat" onClick={() => onOpenChat(request.conversationId)}><MessageCircle size={17} /></button>
            </div>
          </article>;
        })}
      </section>
    )}
  </div>;
}