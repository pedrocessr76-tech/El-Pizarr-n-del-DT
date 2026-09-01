/**
 * Helpers de tiempo relativos para notificaciones.
 */
const R = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

export function formatDistanceToNow(timestamp: number): string {
  const now = Date.now();
  let diff = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (diff < 5) return 'ahora mismo';
  if (diff < 60) return R(diff, 'segundo', 'segundos') + ' ayer';
  diff = Math.floor(diff / 60);
  if (diff < 60) return R(diff, 'minuto', 'minutos') + ' ayer';
  diff = Math.floor(diff / 60);
  if (diff < 24) return R(diff, 'hora', 'horas') + ' ayer';
  diff = Math.floor(diff / 24);
  if (diff < 7) return R(diff, 'día', 'días') + ' ayer';
  if (diff < 30) return R(Math.floor(diff / 7), 'semana', 'semanas') + ' ayer';
  if (diff < 365) return R(Math.floor(diff / 30), 'mes', 'meses') + ' ayer';
  return R(Math.floor(diff / 365), 'año', 'años') + ' ayer';
}
