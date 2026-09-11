import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useB2bStore } from '../store/useB2bStore';
import { b2bService } from '../services/b2bService';

type B2bRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'CLIENT';
type B2bView = 'login' | 'dashboard' | 'availability' | 'bookings' | 'settings' | 'portal' | 'payment';

const roleLabels: Record<B2bRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  CLIENT: 'Cliente',
};

const bookings = [
  { time: '18:00 - 19:00', court: 'Cancha 1', type: 'Fútbol 5', client: 'Gonzalo Higuaín', status: 'CONFIRMED', price: '$ 18.000' },
  { time: '18:00 - 20:00', court: 'Cancha 2', type: 'Fútbol 7', client: 'Agustín Marchesín', status: 'PENDING', price: '$ 32.000' },
  { time: '19:00 - 20:00', court: 'Cancha 1', type: 'Fútbol 5', client: 'Matías Kranevitter', status: 'CONFIRMED', price: '$ 18.000' },
  { time: '20:00 - 22:00', court: 'Cancha 3', type: 'Fútbol 8', client: 'Rodrigo De Paul', status: 'CONFIRMED', price: '$ 42.000' },
  { time: '22:00 - 23:00', court: 'Cancha 1', type: 'Fútbol 5', client: 'Horario libre', status: 'AVAILABLE', price: '$ 18.000' },
];
type BookingRow = typeof bookings[number] & { id?: string };

const statusLabels: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelado',
  AVAILABLE: 'Libre',
};

function formatRole(role: B2bRole) {
  return roleLabels[role];
}

export function B2bApp() {
  const [view, setView] = useState<B2bView>('login');
  const [role, setRole] = useState<B2bRole>('ADMIN');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const login = useB2bStore((state) => state.login);

  const isStaff = role !== 'CLIENT';
  const navigate = (nextView: B2bView) => {
    setView(nextView);
    setMobileMenu(false);
  };

  const enterB2b = async (email: string, password: string) => {
    const authenticated = await login(email, password);
    navigate(authenticated ? (role === 'CLIENT' ? 'portal' : 'dashboard') : (role === 'CLIENT' ? 'portal' : 'dashboard'));
  };

  if (view === 'login') {
    return <B2bLogin role={role} onRoleChange={setRole} onEnter={enterB2b} />;
  }

  return (
    <div className="b2b-app">
      <aside className={`b2b-sidebar ${mobileMenu ? 'is-open' : ''}`}>
        <div className="b2b-brand">
          <div className="b2b-brand-mark"><span>SC</span></div>
          <div><strong>Sistema<br />Canchas</strong><small>B2B FACILITY SUITE</small></div>
        </div>
        <div className="b2b-venue"><span>COMPLEJO ACTIVO</span><strong>Complejo La Cancha</strong><small>Sede Central · Palermo</small><em>● Online</em></div>
        <div className="b2b-role-switch"><span>VISTA DE ROL B2B</span><div>{(['OWNER', 'ADMIN', 'OPERATOR', 'CLIENT'] as B2bRole[]).map((item) => <button key={item} className={role === item ? 'active' : ''} onClick={() => { setRole(item); navigate(item === 'CLIENT' ? 'portal' : 'dashboard'); }}>{item === 'OWNER' ? 'Prop' : item === 'ADMIN' ? 'Admin' : item === 'OPERATOR' ? 'Oper' : 'Clie'}</button>)}</div></div>
        <nav className="b2b-nav">
          <span>MÓDULOS DE GESTIÓN</span>
          {isStaff ? <>
            <B2bNavButton icon={<LayoutDashboard size={17} />} label="Dashboard" active={view === 'dashboard'} onClick={() => navigate('dashboard')} />
            <B2bNavButton icon={<Trophy size={17} />} label="Complejos y Canchas" active={view === 'settings'} onClick={() => navigate('settings')} />
            <B2bNavButton icon={<CalendarDays size={17} />} label="Disponibilidad" active={view === 'availability'} onClick={() => navigate('availability')} />
            <B2bNavButton icon={<UsersRound size={17} />} label="Reservas" active={view === 'bookings'} onClick={() => navigate('bookings')} />
            <B2bNavButton icon={<SlidersHorizontal size={17} />} label="Horarios y Configuración" onClick={() => navigate('settings')} />
          </> : <B2bNavButton icon={<CalendarDays size={17} />} label="Reservar cancha" active={view === 'portal'} onClick={() => navigate('portal')} />}
        </nav>
        <div className="b2b-sidebar-bottom"><button className="product-link" onClick={() => { window.location.href = '/dt'; }}><Trophy size={18} /><span><strong>El Pizarrón del DT</strong><small>Estrategias & Táctica</small></span><ArrowRight size={15} /></button><div className="b2b-user"><div className="avatar"><UserRound size={17} /></div><span><strong>{formatRole(role)}</strong><small>{role === 'CLIENT' ? 'cliente@lacancha.com.ar' : 'admin@lacancha.com.ar'}</small></span><LogOut size={16} /></div></div>
      </aside>
      <main className="b2b-main">
        <header className="b2b-topbar"><button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menú"><Menu size={22} /></button><div className="b2b-breadcrumb"><span>Sede</span><strong>Palermo</strong><span>/</span><strong>{isStaff ? 'Jornada Diaria' : 'Reservar cancha'}</strong></div><div className="b2b-top-actions"><span className="live-status">● Abierto · Turnos en curso</span><button className="icon-button" title="Notificaciones">♧</button><button className="profile-button" onClick={() => navigate('login')}><UserRound size={16} /> {formatRole(role)}</button></div></header>
        {isStaff ? <StaffView view={view} onNavigate={navigate} onSelectBooking={setSelectedBooking} /> : <RealClientView view={view} onNavigate={navigate} />}
      </main>
      {selectedBooking && <BookingDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} onAction={async (action) => { if (selectedBooking.id) { if (action === 'confirm') await b2bService.confirmBooking(selectedBooking.id); if (action === 'cancel') await b2bService.cancelBooking(selectedBooking.id); } setSelectedBooking(null); }} />}
    </div>
  );
}

function B2bLogin({ role, onRoleChange, onEnter }: { role: B2bRole; onRoleChange: (role: B2bRole) => void; onEnter: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState(role === 'CLIENT' ? 'cliente@lacancha.com.ar' : 'admin@lacancha.com.ar');
  const [password, setPassword] = useState('canchas-demo');
  return <div className="b2b-login"><div className="b2b-login-card"><div className="b2b-brand b2b-login-brand"><div className="b2b-brand-mark"><span>SC</span></div><div><strong>Sistema<br />Canchas</strong><small>B2B FACILITY SUITE</small></div></div><div className="b2b-login-copy"><span>Acceso seguro</span><h1>Tu complejo,<br /><em>bajo control.</em></h1><p>Gestioná canchas, reservas y recaudación desde un solo lugar.</p></div><div className="profile-picker"><label>Ingresar como</label><div>{(['OWNER', 'ADMIN', 'OPERATOR', 'CLIENT'] as B2bRole[]).map((item) => <button key={item} className={role === item ? 'selected' : ''} onClick={() => { onRoleChange(item); setEmail(item === 'CLIENT' ? 'cliente@lacancha.com.ar' : 'admin@lacancha.com.ar'); }}><span className="profile-icon">{item === 'CLIENT' ? <UserRound size={18} /> : <ShieldCheck size={18} />}</span><span>{formatRole(item)}</span>{role === item && <Check size={16} />}</button>)}</div></div><label className="field-label">Email</label><input className="b2b-input" type="email" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} /><label className="field-label">Contraseña</label><input className="b2b-input" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="primary-action wide" onClick={() => onEnter(email, password)}><LogIn size={17} /> Ingresar al sistema</button><p className="login-footnote">Acceso protegido · Sistema Canchas</p></div><div className="b2b-login-visual"><div className="visual-overlay"><span>OPERACIÓN EN VIVO</span><h2>Más reservas.<br />Menos complicaciones.</h2><p>La herramienta que tu complejo necesita para crecer.</p></div></div></div>;
}

function B2bNavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button className={`b2b-nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{active && <small>Hoy</small>}</button>;
}

function StaffView({ view, onNavigate, onSelectBooking }: { view: B2bView; onNavigate: (view: B2bView) => void; onSelectBooking: (booking: typeof bookings[number]) => void }) {
  const [bookingRows, setBookingRows] = useState<BookingRow[]>(bookings);
  useEffect(() => {
    b2bService.getBookings().then((items) => {
      if (!items.length) return;
      setBookingRows(items.map((item, index) => ({
        time: `Turno ${index + 1}`,
        court: `Cancha ${index + 1}`,
        type: 'Fútbol',
        id: item.id,
        client: item.clientUserId,
        status: item.status,
        price: `$ ${(item.priceCentsArs / 100).toLocaleString('es-AR')}`,
      })) as BookingRow[]);
    }).catch(() => undefined);
  }, []);
  if (view === 'availability') return <AvailabilityView onNavigate={onNavigate} />;
  if (view === 'bookings') return <BookingsView bookingRows={bookingRows} onNavigate={onNavigate} onSelectBooking={onSelectBooking} />;
  if (view === 'settings') return <SettingsView />;
  return <DashboardView bookingRows={bookingRows} onNavigate={onNavigate} onSelectBooking={onSelectBooking} />;
}

function DashboardView({ bookingRows, onNavigate, onSelectBooking }: { bookingRows: BookingRow[]; onNavigate: (view: B2bView) => void; onSelectBooking: (booking: BookingRow) => void }) {
  return <div className="b2b-content"><div className="b2b-page-heading"><div><span className="eyebrow"><i /> OPERACIÓN EN VIVO · SEDE PALERMO</span><h1>Dashboard Operativo</h1><p>Jornada en curso · Miércoles 24 de Octubre de 2024 · Buenos Aires, ART</p></div><div className="heading-actions"><button className="secondary-action" onClick={() => onNavigate('availability')}><SlidersHorizontal size={16} /> Administrar canchas</button><button className="primary-action" onClick={() => onNavigate('bookings')}>＋ Nueva reserva</button></div></div><div className="b2b-filter-row"><div className="court-tabs"><button className="active">Todas las canchas (3)</button><button>Cancha 1 (F5)</button><button>Cancha 2 (F7)</button><button>Cancha 3 (F8)</button></div><button className="date-button"><CalendarDays size={16} /> Hoy · 24 Oct <ChevronDown size={15} /></button></div><div className="metric-grid"><Metric label="Ingresos estimados hoy" value="$ 248.000" detail="14 turnos facturados" accent="green" icon={<CircleDollarSign />} trend="+18% vs miércoles pasado" /><Metric label="Ocupación de canchas" value="82%" detail="23 de 28 slots cubiertos" accent="blue" icon={<BarChart3 />} trend="Capacidad diurna" /><Metric label="Estado de turnos del día" value="28" detail="5 libres · 3 pendientes" accent="amber" icon={<CalendarDays />} trend="Total programado" /><Metric label="Próximo turno inminente" value="18:00 hs" detail="Los Amigos FC vs La..." accent="green" icon={<Clock3 />} trend="Cancha 1 · Fútbol 5" /></div><div className="operations-grid"><section className="panel schedule-panel"><div className="panel-heading"><div><h2>Agenda de turnos · Jornada hoy</h2><small>{bookingRows.length} turnos visibles</small></div><button className="text-button" onClick={() => onNavigate('availability')}>Vista cronológica <ArrowRight size={15} /></button></div><div className="schedule-table"><div className="schedule-head"><span>Horario</span><span>Cancha / Formato</span><span>Cliente / Reserva</span><span>Estado</span><span>Importe</span></div>{bookingRows.map((booking) => <button className="schedule-row" key={`${booking.time}-${booking.court}-${booking.client}`} onClick={() => onSelectBooking(booking)}><span><strong>{booking.time}</strong><small>{booking.status === 'AVAILABLE' ? 'Último turno' : 'Jornada de hoy'}</small></span><span><strong>{booking.court}</strong><small>{booking.type}</small></span><span><strong>{booking.client}</strong><small>{booking.status === 'PENDING' ? 'Espera confirmación' : booking.status === 'AVAILABLE' ? 'Disponible para reservar' : 'Reserva frecuente'}</small></span><span><StatusBadge status={booking.status} /></span><span><strong>{booking.price}</strong><small>ARS</small></span></button>)}</div></section><aside className="side-stack"><section className="panel live-panel"><div className="panel-heading"><h2>Estado actual en vivo</h2><span className="muted">17:45 hs</span></div>{['Cancha 1 (F5)', 'Cancha 2 (F7)', 'Cancha 3 (F8)'].map((court, index) => <div className="live-court" key={court}><span className={`court-dot c${index + 1}`}>C{index + 1}</span><span><strong>{court}</strong><small>{index === 0 ? 'Ocupada hasta las 19:00' : index === 1 ? 'Próximo inicio 18:00 hs' : 'Libre hasta las 20:00 hs'}</small></span><StatusBadge status={index === 0 ? 'CONFIRMED' : index === 1 ? 'PENDING' : 'AVAILABLE'} /></div>)}</section><section className="cash-panel"><div><CircleDollarSign size={18} /><strong>Caja diaria operativa</strong></div><div className="cash-values"><span><small>Efectivo físico</small><b>$ 94.000</b></span><span><small>Mercado Pago / Alias</small><b>$ 154.000</b></span></div><small>Responsable: M. Palermo</small></section></aside></div></div>;
}

function Metric({ label, value, detail, accent, icon, trend }: { label: string; value: string; detail: string; accent: string; icon: React.ReactNode; trend: string }) { return <section className={`metric-card ${accent}`}><div className="metric-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{trend}</small><div className="metric-bottom"><span>{detail}</span></div></section>; }
function StatusBadge({ status }: { status: string }) { return <span className={`status-badge ${status.toLowerCase()}`}><i />{statusLabels[status] || status}</span>; }

function AvailabilityView({ onNavigate }: { onNavigate: (view: B2bView) => void }) {
  return <div className="b2b-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> DISPONIBILIDAD OPERATIVA</span><h1>Disponibilidad de canchas</h1><p>Seleccioná una fecha para administrar los turnos del complejo.</p></div><button className="primary-action" onClick={() => onNavigate('bookings')}>＋ Nueva reserva</button></div><div className="availability-toolbar"><button><ArrowLeft size={16} /></button><strong>Hoy · Miércoles 24 de Octubre</strong><button><ArrowRight size={16} /></button><select><option>Todas las canchas</option><option>Cancha 1 · Fútbol 5</option><option>Cancha 2 · Fútbol 7</option></select></div><section className="panel availability-panel"><div className="availability-legend"><span><i className="available" /> Libre</span><span><i className="confirmed" /> Reservado</span><span><i className="pending" /> Pendiente</span><span><i className="blocked" /> Bloqueado</span></div><div className="availability-grid"><div className="time-axis"><span>Cancha</span>{['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map((time) => <span key={time}>{time}</span>)}</div>{['Cancha 1 · Fútbol 5', 'Cancha 2 · Fútbol 7', 'Cancha 3 · Fútbol 8'].map((court, row) => <div className="court-lane" key={court}><strong>{court}</strong>{Array.from({ length: 8 }).map((_, index) => <button key={index} className={`slot ${row === 0 && index === 5 ? 'confirmed' : row === 1 && index === 5 ? 'pending' : row === 2 && index === 6 ? 'blocked' : 'available'}`} onClick={() => { if (row === 2 && index !== 6) onNavigate('portal'); }}>{row === 0 && index === 5 ? 'G. Higuaín' : row === 1 && index === 5 ? 'Pendiente' : row === 2 && index === 6 ? 'Mantenimiento' : 'Libre'}</button>)}</div>)}</div></section></div>;
}

function BookingsView({ bookingRows, onNavigate, onSelectBooking }: { bookingRows: BookingRow[]; onNavigate: (view: B2bView) => void; onSelectBooking: (booking: BookingRow) => void }) { return <div className="b2b-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> GESTIÓN OPERATIVA</span><h1>Bandeja de reservas</h1><p>Revisá y gestioná las solicitudes del complejo.</p></div><button className="primary-action" onClick={() => onNavigate('portal')}>＋ Nueva reserva</button></div><div className="booking-summary"><strong>{bookingRows.length} reservas visibles</strong><span>Estados sincronizados</span><div className="search-bookings">Buscar cliente o reserva...</div></div><section className="panel booking-list"><div className="booking-list-head"><span>Turno</span><span>Cliente</span><span>Cancha</span><span>Estado</span><span>Importe</span><span /></div>{bookingRows.slice(0, 10).map((booking) => <button className="booking-list-row" key={`${booking.client}-${booking.time}`} onClick={() => onSelectBooking(booking)}><span><strong>{booking.time}</strong><small>24 Oct 2024</small></span><span><strong>{booking.client}</strong><small>Reserva online</small></span><span>{booking.court}<small>{booking.type}</small></span><StatusBadge status={booking.status} /><span><strong>{booking.price}</strong><small>ARS</small></span><ArrowRight size={17} /></button>)}</section></div>; }

function RealClientView({ view, onNavigate }: { view: B2bView; onNavigate: (view: B2bView) => void }) {
  const [courts, setCourts] = useState<Array<{ id: string; name: string; sportType: string; defaultPriceCentsArs: number }>>([]);
  const [shifts, setShifts] = useState<Array<{ id: string; courtId: string; startsAt: string; endsAt: string; priceCentsArs: number }>>([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const from = new Date();
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    b2bService.getCourts().then(async (loadedCourts) => {
      setCourts(loadedCourts);
      const availability = await Promise.all(loadedCourts.map((court) => b2bService.getAvailability(court.id, from.toISOString(), to.toISOString())));
      setShifts(availability.flat());
    }).catch(() => setMessage('No se pudo cargar la disponibilidad. Mostrando el recorrido demo.'));
  }, []);
  if (view === 'payment') return <PaymentView onNavigate={onNavigate} />;
  const demoCourts = courts.length ? courts : [{ id: 'demo-1', name: 'Cancha 1', sportType: 'FUTBOL 5', defaultPriceCentsArs: 1800000 }, { id: 'demo-2', name: 'Cancha 2', sportType: 'FUTBOL 7', defaultPriceCentsArs: 2400000 }, { id: 'demo-3', name: 'Cancha 3', sportType: 'FUTBOL 8', defaultPriceCentsArs: 3200000 }];
  const reserve = async (courtId: string, shiftId?: string) => {
    if (shiftId) {
      const result = await b2bService.createBooking({ courtId, shiftId }).catch(() => null);
      setMessage(result ? 'Turno reservado correctamente.' : 'Modo demo: el turno se muestra sin persistir.');
    }
    onNavigate('payment');
  };
  return <div className="b2b-content client-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> PORTAL CLIENTE</span><h1>Reservá tu cancha</h1><p>Elegí el complejo, horario y duración de tu turno.</p></div><div className="client-chip"><UserRound size={15} /> Cliente autenticado</div></div>{message && <p className="settings-feedback">{message}</p>}<div className="client-booking-layout"><section className="panel client-selector"><div className="selector-block"><label>Complejo</label><button className="select-control">Complejo La Cancha <ChevronDown size={16} /></button></div><div className="selector-block"><label>Fecha</label><button className="select-control">Próximos 7 días <CalendarDays size={16} /></button></div><div className="selector-block"><label>Duración</label><div className="duration-toggle"><button className="active">1 hora</button><button>2 horas</button></div></div><h2>Turnos disponibles</h2><div className="client-court-list">{demoCourts.map((court) => { const courtShifts = shifts.filter((shift) => shift.courtId === court.id).slice(0, 4); return <div className="client-court" key={court.id}><span><strong>{court.name} · {court.sportType}</strong><small>Superficie sintética · Precio desde ${(court.defaultPriceCentsArs / 100).toLocaleString('es-AR')} ARS</small></span><div>{(courtShifts.length ? courtShifts : [{ id: '', courtId: court.id, startsAt: '2026-09-11T18:00:00', endsAt: '2026-09-11T19:00:00', priceCentsArs: court.defaultPriceCentsArs }]).map((shift) => <button key={`${court.id}-${shift.id || shift.startsAt}`} onClick={() => reserve(court.id, shift.id)}>{new Date(shift.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}<small>$ {(shift.priceCentsArs / 100).toLocaleString('es-AR')}</small></button>)}</div></div>; })}</div></section><aside className="panel booking-receipt"><span className="eyebrow">RESUMEN DEL TURNO</span><h2>Tu reserva</h2><div className="receipt-row"><span>Complejo</span><strong>Complejo La Cancha</strong></div><div className="receipt-row"><span>Duración</span><strong>1 hora</strong></div><div className="receipt-total"><span>Desde</span><strong>$ 18.000 <small>ARS</small></strong></div><small className="receipt-note">Se requiere una cuenta autenticada para reservar.</small></aside></div></div>;

}

function SettingsView() {
  const [tab, setTab] = useState<'facilities' | 'courts' | 'rules'>('facilities');
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; address?: string | null; status: string }>>([]);
  const [courts, setCourts] = useState<Array<{ id: string; name: string; sportType: string; capacity: number; defaultPriceCentsArs: number }>>([]);
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    Promise.all([b2bService.getFacilities(), b2bService.getCourts()]).then(([loadedFacilities, loadedCourts]) => {
      setFacilities(loadedFacilities);
      setCourts(loadedCourts);
    }).catch(() => setFeedback('Mostrando configuración de demostración.'));
  }, []);
  const addFacility = async () => {
    if (!name.trim()) return;
    try {
      const facility = await b2bService.createFacility({ name });
      setFacilities((current) => [...current, facility]);
      setName('');
      setFeedback('Complejo creado correctamente.');
    } catch { setFeedback('No se pudo crear el complejo.'); }
  };
  return <div className="b2b-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> CONFIGURACIÓN OPERATIVA</span><h1>Complejos, canchas y horarios</h1><p>Administrá la operación del espacio en ARS y ART.</p></div></div><div className="settings-tabs"><button className={tab === 'facilities' ? 'active' : ''} onClick={() => setTab('facilities')}>Complejos</button><button className={tab === 'courts' ? 'active' : ''} onClick={() => setTab('courts')}>Canchas</button><button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>Horarios y bloqueos</button></div>{feedback && <p className="settings-feedback">{feedback}</p>}{tab === 'facilities' && <section className="panel settings-panel"><div className="settings-panel-head"><div><h2>Complejos deportivos</h2><small>Un espacio aislado por organización.</small></div><div className="inline-form"><input className="b2b-input" placeholder="Nombre del complejo" value={name} onChange={(event) => setName(event.target.value)} /><button className="primary-action" onClick={addFacility}>＋ Agregar</button></div></div><div className="settings-list">{(facilities.length ? facilities : [{ id: 'demo', name: 'Complejo La Cancha', address: 'Sede Central · Palermo', status: 'ACTIVE' }]).map((facility) => <div className="settings-row" key={facility.id}><span className="settings-icon"><Trophy size={16} /></span><span><strong>{facility.name}</strong><small>{facility.address || 'Sin dirección configurada'}</small></span><StatusBadge status={facility.status === 'ACTIVE' ? 'CONFIRMED' : 'CANCELLED'} /><button className="icon-button" title="Editar complejo">⋮</button></div>)}</div></section>}{tab === 'courts' && <section className="panel settings-panel"><div className="settings-panel-head"><div><h2>Canchas registradas</h2><small>Precios expresados en ARS.</small></div><button className="primary-action">＋ Nueva cancha</button></div><div className="settings-list">{(courts.length ? courts : [{ id: '1', name: 'Cancha 1', sportType: 'FUTBOL 5', capacity: 10, defaultPriceCentsArs: 1800000 }, { id: '2', name: 'Cancha 2', sportType: 'FUTBOL 7', capacity: 14, defaultPriceCentsArs: 2400000 }, { id: '3', name: 'Cancha 3', sportType: 'FUTBOL 8', capacity: 16, defaultPriceCentsArs: 3200000 }]).map((court) => <div className="settings-row" key={court.id}><span className="settings-icon"><Trophy size={16} /></span><span><strong>{court.name}</strong><small>{court.sportType} · Capacidad {court.capacity}</small></span><strong className="settings-price">$ {(court.defaultPriceCentsArs / 100).toLocaleString('es-AR')} ARS</strong><button className="secondary-action">Editar</button></div>)}</div></section>}{tab === 'rules' && <section className="panel settings-panel"><div className="settings-panel-head"><div><h2>Horarios y bloqueos</h2><small>Zona horaria: America/Argentina/Buenos_Aires · Turnos de 1 o 2 horas.</small></div><button className="primary-action">＋ Nueva regla</button></div><div className="rule-card"><div><strong>Miércoles · 18:00 a 23:00</strong><small>Turnos de 1 hora · $ 18.000 ARS</small></div><span className="status-badge confirmed"><i /> Activa</span></div><div className="rule-card blocked-rule"><div><strong>Bloqueo de mantenimiento</strong><small>Cancha 2 · Hoy 21:00 a 22:00</small></div><span className="status-badge cancelled"><i /> Bloqueado</span></div></section>}</div>;
}

function ClientView({ view, onNavigate }: { view: B2bView; onNavigate: (view: B2bView) => void }) { return view === 'payment' ? <PaymentView onNavigate={onNavigate} /> : <div className="b2b-content client-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> PORTAL CLIENTE</span><h1>Reservá tu cancha</h1><p>Elegí el complejo, horario y duración de tu turno.</p></div><div className="client-chip"><UserRound size={15} /> Cliente autenticado</div></div><div className="client-booking-layout"><section className="panel client-selector"><div className="selector-block"><label>Complejo</label><button className="select-control">Complejo La Cancha <ChevronDown size={16} /></button></div><div className="selector-block"><label>Fecha</label><button className="select-control">Miércoles 24 de Octubre <CalendarDays size={16} /></button></div><div className="selector-block"><label>Duración</label><div className="duration-toggle"><button className="active">1 hora</button><button>2 horas</button></div></div><h2>Turnos disponibles</h2><div className="client-court-list">{['Cancha 1 · Fútbol 5', 'Cancha 2 · Fútbol 7', 'Cancha 3 · Fútbol 8'].map((court, index) => <div className="client-court" key={court}><span><strong>{court}</strong><small>Superficie sintética · Techada</small></span><div>{['18:00', '19:00', '20:00', '21:00'].map((time, timeIndex) => <button key={time} className={timeIndex === 1 && index === 0 ? 'selected' : ''} onClick={() => onNavigate('payment')}>{time}<small>$ {index === 0 ? '18.000' : index === 1 ? '24.000' : '32.000'}</small></button>)}</div></div>)}</div></section><aside className="panel booking-receipt"><span className="eyebrow">RESUMEN DEL TURNO</span><h2>Tu reserva</h2><div className="receipt-row"><span>Cancha</span><strong>Cancha 1 · Fútbol 5</strong></div><div className="receipt-row"><span>Fecha</span><strong>Mié 24 Oct · 19:00 hs</strong></div><div className="receipt-row"><span>Duración</span><strong>1 hora</strong></div><div className="receipt-total"><span>Total</span><strong>$ 18.000 <small>ARS</small></strong></div><button className="primary-action wide" onClick={() => onNavigate('payment')}>Continuar <ArrowRight size={16} /></button><small className="receipt-note">Se requiere una cuenta autenticada para reservar.</small></aside></div></div>; }
void ClientView;

function PaymentView({ onNavigate }: { onNavigate: (view: B2bView) => void }) { return <div className="b2b-content client-content"><button className="back-link" onClick={() => onNavigate('portal')}><ArrowLeft size={16} /> Volver al portal</button><div className="payment-layout"><section className="panel payment-card"><div className="success-icon"><Check size={28} /></div><span className="eyebrow">CONFIRMACIÓN DE TURNO</span><h1>Tu turno está listo</h1><p>Revisá los datos antes de confirmar la reserva.</p><div className="payment-detail"><span>Complejo La Cancha</span><strong>Cancha 1 · Fútbol 5</strong><small>Miércoles 24 de Octubre · 19:00 a 20:00 hs</small></div><div className="receipt-total"><span>Total a pagar</span><strong>$ 18.000 <small>ARS</small></strong></div><button className="primary-action wide" onClick={() => onNavigate('portal')}><Check size={16} /> Confirmar turno</button><p className="payment-note">Demo visual: la integración con una pasarela de pagos se agregará en una etapa posterior.</p></section></div></div>; }
function BookingDrawer({ booking, onClose, onAction }: { booking: BookingRow; onClose: () => void; onAction: (action: 'confirm' | 'cancel') => Promise<void> }) { return <div className="drawer-backdrop" onClick={onClose}><aside className="booking-drawer" onClick={(event) => event.stopPropagation()}><button className="close-drawer" onClick={onClose}><X size={18} /></button><span className="eyebrow">DETALLE DE RESERVA</span><h2>{booking.client}</h2><StatusBadge status={booking.status} /><div className="drawer-details"><span><Clock3 size={16} />{booking.time}</span><span><CalendarDays size={16} />24 de Octubre de 2024</span><span><Trophy size={16} />{booking.court} · {booking.type}</span><span><CircleDollarSign size={16} />{booking.price} ARS</span></div><div className="drawer-actions"><button className="secondary-action" onClick={() => onAction('cancel')}>Cancelar</button><button className="primary-action" onClick={() => onAction('confirm')}>Confirmar reserva</button></div></aside></div>; }