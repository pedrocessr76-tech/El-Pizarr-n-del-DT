import { useEffect, useState } from 'react';
import { b2bService, type B2bMetricsSummary } from '../../services/b2bService';

export function OperationalMetrics() {
  const [metrics, setMetrics] = useState<B2bMetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    b2bService.getMetricsSummary().then((data) => {
      if (active) setMetrics(data);
    }).catch(() => {
      if (active) setError('No se pudieron cargar las métricas.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  if (loading) return <p role="status">Cargando métricas…</p>;
  if (error) return <p role="alert">{error} <button className="secondary-action" onClick={() => setRefresh((value) => value + 1)}>Reintentar</button></p>;
  if (!metrics) return null;
  // La API calcula ingresos y estados sobre todo el historial, no sólo hoy.
  const cards = [
    { label: 'Ingresos acumulados', value: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(metrics.revenueCentsArs / 100), detail: 'Reservas confirmadas y completadas' },
    { label: 'Ocupación del día', value: `${metrics.totalShifts ? Math.round(metrics.occupiedShifts / metrics.totalShifts * 100) : 0}%`, detail: `${metrics.occupiedShifts} de ${metrics.totalShifts} turnos · ${metrics.date}` },
    { label: 'Turnos libres del día', value: String(metrics.availableShifts), detail: metrics.date },
    { label: 'Reservas pendientes', value: String(metrics.pendingBookings), detail: `${metrics.confirmedBookings} confirmadas · ${metrics.cancelledBookings} canceladas (historial)` },
  ];
  return <div className="metric-grid">{cards.map((card) => <section className="metric-card green" key={card.label}><div className="metric-top"><span>{card.label}</span></div><strong>{card.value}</strong><div className="metric-bottom"><span>{card.detail}</span></div></section>)}</div>;
}
