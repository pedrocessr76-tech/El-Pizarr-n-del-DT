import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { B2bPendingWhatsAppAlert, b2bService, buildWhatsAppDeepLink } from '../../services/b2bService';

const POLL_INTERVAL_MS = 60_000;

/**
 * Avisos de WhatsApp pendientes de despacho manual (#34).
 *
 * El backend no envía WhatsApp: arma el mensaje y lo deja acá. El personal abre
 * el chat con un deep link `wa.me` y, cuando lo mandó, confirma el despacho para
 * que el aviso salga de la lista. La confirmación es best-effort a propósito: el
 * envío ocurre en el teléfono, así que el servidor no puede verificarlo.
 */
export function PendingAlertsPanel() {
  const [alerts, setAlerts] = useState<B2bPendingWhatsAppAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      const pending = await b2bService.getPendingWhatsAppAlerts();
      setAlerts(pending);
      setError('');
    } catch {
      setError('No se pudieron cargar los avisos pendientes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load('initial');
    // El processor corre cada minuto: refrescar al mismo ritmo mantiene la lista
    // al día sin castigar la API cuando la ventana está abierta y quieta.
    const timer = setInterval(() => void load('refresh'), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const confirmDispatched = async (alert: B2bPendingWhatsAppAlert) => {
    if (dispatchingId) return;
    setDispatchingId(alert.reminderId);
    try {
      await b2bService.markWhatsAppAlertDispatched(alert.reminderId);
      setAlerts((current) => current.filter((item) => item.reminderId !== alert.reminderId));
    } catch {
      setError('No se pudo confirmar el despacho. Vuelve a intentar.');
    } finally {
      setDispatchingId(null);
    }
  };

  /**
   * El deep link no abre nada si WhatsApp no está instalado, y en un celular
   * sin app el staff queda sin poder avisar. Copiar teléfono y texto cubre ese
   * caso sin exigir ningún proveedor de envío.
   */
  const copyAlert = async (alert: B2bPendingWhatsAppAlert) => {
    try {
      await navigator.clipboard.writeText(`${alert.phone}\n${alert.body}`);
      setCopiedId(alert.reminderId);
      setError('');
    } catch {
      setError('No se pudo copiar. Seleccioná el texto y envialo a mano.');
    }
  };

  return <section className="panel pending-alerts" aria-labelledby="pending-alerts-title">
    <div className="reminder-settings-heading">
      <span className="reminder-icon"><MessageCircle size={18} /></span>
      <div><h2 id="pending-alerts-title">Avisos pendientes</h2><p>Mensajes de WhatsApp que tenés que mandar vos.</p></div>
      <button type="button" className="secondary-action" onClick={() => void load('refresh')} disabled={refreshing} aria-label="Actualizar avisos pendientes">
        <RefreshCw size={14} /> {refreshing ? 'Actualizando…' : 'Actualizar'}
      </button>
    </div>

    {loading ? <p role="status">Cargando avisos…</p> : <>
      {error && <p role="alert" className="settings-feedback caveat">{error}</p>}
      {alerts.length === 0
        ? <p className="pending-alerts-empty">No hay avisos pendientes. Cada recordatorio de WhatsApp aparece acá cuando vence.</p>
        : <ul className="pending-alerts-list">
          {alerts.map((alert) => <li key={alert.reminderId} className="pending-alerts-item">
            <div className="pending-alerts-meta">
              <strong>{alert.clientName}</strong>
              <span>{alert.courtName} · {alert.dateLabel} {alert.timeLabel}</span>
              <small>{alert.phone}</small>
            </div>
            <p className="pending-alerts-body">{alert.body}</p>
            <div className="pending-alerts-actions">
              <a className="primary-action" href={buildWhatsAppDeepLink(alert.phone, alert.body)} target="_blank" rel="noopener noreferrer">
                <Send size={14} /> Mandar por WhatsApp
              </a>
              <button type="button" className="secondary-action" disabled={copiedId === alert.reminderId} onClick={() => void copyAlert(alert)}>
                <Copy size={14} /> {copiedId === alert.reminderId ? 'Copiado' : 'Copiar'}
              </button>
              <button type="button" className="secondary-action" disabled={dispatchingId === alert.reminderId} onClick={() => void confirmDispatched(alert)}>
                <Check size={14} /> {dispatchingId === alert.reminderId ? 'Guardando…' : 'Ya lo mandé'}
              </button>
            </div>
          </li>)}
        </ul>}
    </>}
  </section>;
}