import { Clock3, MapPin } from 'lucide-react';
import { formatDayLabel, formatHourLabel, toDayKey } from '../../utils/orgTime';
import type { B2bCourt, B2bFacility, B2bWeeklyAvailability } from '../../services/b2bService';

type DailyLane = B2bWeeklyAvailability['lanes'][number];

interface DashboardCourtsProps {
  facilities: B2bFacility[];
  courts: B2bCourt[];
  availability: B2bWeeklyAvailability[];
  selectedDate: string;
  timezone: string;
  facilityId: string;
  selectedCourtId: string;
  loading: boolean;
  error: string;
  onFacilityChange: (id: string) => void;
  onCourtChange: (id: string) => void;
  onSelectShift: (courtId: string, lane: DailyLane) => void;
  onManage: () => void;
}

const stateLabels: Record<DailyLane['state'], string> = {
  AVAILABLE: 'Libre',
  PENDING: 'Pendiente',
  CONFIRMED: 'Reservada',
  BLOCKED: 'Bloqueada',
};

export function DashboardCourts({
  facilities,
  courts,
  availability,
  selectedDate,
  timezone,
  facilityId,
  selectedCourtId,
  loading,
  error,
  onFacilityChange,
  onCourtChange,
  onSelectShift,
  onManage,
}: DashboardCourtsProps) {
  const selectedFacility = facilities.find((facility) => facility.id === facilityId);
  const facilityCourts = courts.filter((court) => court.facilityId === facilityId && court.status === 'ACTIVE');

  return <section className="panel dashboard-courts-panel">
    <div className="panel-heading dashboard-courts-heading">
      <div>
        <span className="eyebrow"><MapPin size={13} /> ESTADO DE LAS CANCHAS</span>
        <h2>{selectedFacility?.name ?? 'Canchas del complejo'}</h2>
        <small>Turnos del {formatDayLabel(timezone, selectedDate)}</small>
      </div>
      <span className="dashboard-facility-count">{facilityCourts.length} {facilityCourts.length === 1 ? 'cancha' : 'canchas'}</span>
    </div>

    {facilities.length > 0 && <div className="dashboard-facility-tabs" role="tablist" aria-label="Complejos">
      {facilities.map((facility) => {
        const count = courts.filter((court) => court.facilityId === facility.id && court.status === 'ACTIVE').length;
        const selected = facility.id === facilityId;
        return <button key={facility.id} type="button" role="tab" aria-selected={selected} className={selected ? 'active' : ''} onClick={() => onFacilityChange(facility.id)}>
          <span>{facility.name}</span><small>{count}</small>
        </button>;
      })}
    </div>}

    {error && <p className="settings-feedback caveat dashboard-courts-error" role="alert">{error}</p>}
    {loading && <div className="availability-empty" role="status">Cargando horarios de las canchas…</div>}
    {!loading && facilities.length === 0 && <div className="dashboard-courts-empty"><strong>Todavía no hay complejos.</strong><span>Creá un complejo para empezar a organizar sus canchas.</span><button type="button" className="secondary-action" onClick={onManage}>Administrar complejos</button></div>}
    {!loading && facilities.length > 0 && facilityCourts.length === 0 && <div className="dashboard-courts-empty"><strong>Este complejo todavía no tiene canchas.</strong><span>Agregá una cancha para consultar su ocupación y sus turnos.</span><button type="button" className="secondary-action" onClick={onManage}>Administrar canchas</button></div>}
    {!loading && facilities.length > 0 && facilityCourts.length > 0 && <div className="dashboard-court-grid">
      {facilityCourts.map((court, index) => {
        const board = availability.find((item) => item.courtId === court.id);
        const lanes = (board?.lanes ?? []).filter((lane) => toDayKey(timezone, lane.startsAt) === selectedDate);
        const isShiftPast = (lane: DailyLane) => new Date(lane.startsAt).getTime() <= Date.now();
        const occupied = lanes.filter((lane) => lane.state === 'PENDING' || lane.state === 'CONFIRMED');
        const availableCount = lanes.filter((lane) => lane.state === 'AVAILABLE' && !isShiftPast(lane)).length;
        const blockedCount = lanes.filter((lane) => lane.state === 'BLOCKED').length;
        const shiftMinutes = (lane: DailyLane) => (new Date(lane.endsAt).getTime() - new Date(lane.startsAt).getTime()) / 60_000;
        const totalMinutes = lanes.reduce((total, lane) => total + shiftMinutes(lane), 0);
        const occupiedMinutes = occupied.reduce((total, lane) => total + shiftMinutes(lane), 0);
        const occupancy = totalMinutes ? Math.round((occupiedMinutes / totalMinutes) * 100) : 0;
        const isSelected = selectedCourtId === court.id;
        const availabilityText = !lanes.length
          ? 'Sin turnos'
          : occupied.length
            ? 'Ocupada'
            : availableCount === 0
              ? (lanes.every((l) => isShiftPast(l)) ? 'Finalizada' : blockedCount > 0 ? 'Bloqueada' : 'Sin libres')
              : 'Libre';

        return <article className={`dashboard-court-card ${isSelected ? 'is-selected' : ''}`} key={court.id}>
          <button type="button" className={`dashboard-court-visual pitch-variant-${index % 3}`} aria-pressed={isSelected} onClick={() => onCourtChange(isSelected ? 'all' : court.id)}>
            <span className="pitch-lines" aria-hidden="true"><i /><b /></span>
            <span className={`court-occupancy-badge ${occupied.length ? 'occupied' : availableCount ? 'free' : lanes.length ? 'blocked' : 'empty'}`}>{availabilityText}</span>
            <span className="dashboard-court-name">{court.name}</span>
            <span className="dashboard-court-sport">{court.sportType}</span>
          </button>
          <div className="dashboard-court-summary">
            <strong>{occupied.length} de {lanes.length} turnos ocupados</strong>
            <span>{occupancy}% de la grilla</span>
          </div>
          <div className="court-occupancy-track" aria-label={`${occupancy}% de ocupación`}><i style={{ width: `${occupancy}%` }} /></div>
          <div className="dashboard-court-legend"><span>{availableCount} libres</span><span>{blockedCount} bloqueados</span></div>
          <div className="dashboard-court-times">
            <h3><Clock3 size={14} /> Horarios del día</h3>
            {!lanes.length && <p className="court-times-empty">No hay turnos generados para esta fecha.</p>}
            {lanes.map((lane) => {
              const time = `${formatHourLabel(timezone, lane.startsAt)}–${formatHourLabel(timezone, lane.endsAt)}`;
              const client = lane.clientName ? ` · ${lane.clientName}` : '';
              const isPast = isShiftPast(lane);
              const isBooked = lane.state === 'CONFIRMED' || lane.state === 'PENDING';
              const isBlocked = lane.state === 'BLOCKED';
              const displayState = isBooked
                ? stateLabels[lane.state]
                : isBlocked
                  ? 'Bloqueada'
                  : isPast
                    ? 'Pasado'
                    : 'Libre';
              const stateClass = isBooked
                ? lane.state.toLowerCase()
                : isBlocked
                  ? 'blocked'
                  : isPast
                    ? 'expired'
                    : 'available';
              const content = <><strong>{time}</strong><small>{displayState}{isBooked ? client : ''}</small></>;
              return isBooked
                ? <button type="button" className={`dashboard-court-time ${stateClass}`} key={lane.id} onClick={() => onSelectShift(court.id, lane)}>{content}<span>Ver reserva</span></button>
                : <div className={`dashboard-court-time ${stateClass}`} key={lane.id}>{content}</div>;
            })}
          </div>
        </article>;
      })}
    </div>}
  </section>;
}
