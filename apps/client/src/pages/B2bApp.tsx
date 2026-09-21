import { ScheduleSettings } from '../components/b2b/ScheduleSettings';

import { OperationalMetrics } from '../components/b2b/OperationalMetrics';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  SlidersHorizontal,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useB2bStore } from '../store/useB2bStore';
import { b2bService, type B2bOrganizationOption } from '../services/b2bService';
import { MobileTopBar } from '../components/layout/MobileTopBar';
import { MobileTabBar, type MobileTab } from '../components/layout/MobileTabBar';
import { useB2bNotificationSocket } from '../services/b2bNotificationSocket';
import { B2bNotificationBell } from '../components/b2b/B2bNotificationBell';
import { B2bNotificationToasts } from '../components/b2b/B2bNotificationToasts';

type B2bRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'CLIENT';
type B2bView = 'login' | 'dashboard' | 'availability' | 'bookings' | 'settings' | 'portal' | 'payment';

const roleLabels: Record<B2bRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  CLIENT: 'Cliente',
};

const bookings: BookingRow[] = [];
type BookingRow = {
  id?: string;
  time: string;
  court: string;
  type: string;
  client: string;
  status: string;
  price: string;
};

const statusLabels: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelado',
  AVAILABLE: 'Libre',
};

function formatRole(role: B2bRole) {
  return roleLabels[role];
}

function resolveRole(user: { roles?: string[] } | null): B2bRole {
  if (!user) return 'CLIENT';
  return (user.roles ?? []).some((r) => r.toUpperCase() === 'CLIENT') ? 'CLIENT' : 'ADMIN';
}

export function B2bApp() {
  useB2bNotificationSocket();
  const [view, setView] = useState<B2bView>(() => {
    const stored = useB2bStore.getState().user;
    if (!stored) return 'login';
    return resolveRole(stored) === 'CLIENT' ? 'portal' : 'dashboard';
  });
  const [role, setRole] = useState<B2bRole>(() => resolveRole(useB2bStore.getState().user));
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const login = useB2bStore((state) => state.login);
  const registerClient = useB2bStore((state) => state.registerClient);

      const isStaff = role !== 'CLIENT';
  const user = useB2bStore((state) => state.user);
  const [organizations, setOrganizations] = useState<B2bOrganizationOption[]>([]);
  useEffect(() => {
    if (user) {
      b2bService.getPublicOrganizations().then(setOrganizations).catch(() => setOrganizations([]));
    }
  }, [user]);
  const orgName = organizations.find((org) => org.id === user?.organizationId)?.name ?? '';
  const navigate = (nextView: B2bView) => {
    setView(nextView);
    setMobileMenu(false);
  };

  const enterB2b = async (email: string, password: string) => {
    const authenticated = await login(email, password);
    if (!authenticated) return;
    const nextRole = resolveRole(useB2bStore.getState().user);
    setRole(nextRole);
    navigate(nextRole === 'CLIENT' ? 'portal' : 'dashboard');
  };

  const registerClientAccount = async (input: { email: string; fullName: string; password: string }) => {
    const created = await registerClient(input);
    if (!created) return;
    // Un cliente recién registrado entra a su portal: ahí elige en qué complejo reservar.
    setRole('CLIENT');
    navigate('portal');
  };

  if (view === 'login') {
    return <B2bLogin onEnter={enterB2b} onRegisterClient={registerClientAccount} />;
  }

  const mobileTabs: MobileTab<B2bView>[] = isStaff
    ? [
        { id: 'dashboard', label: 'Operativa', icon: 'dashboard' },
        { id: 'availability', label: 'Canchas', icon: 'calendar_month' },
        { id: 'bookings', label: 'Reservas', icon: 'groups' },
        { id: 'login', label: 'Perfil', icon: 'person' },
      ]
    : [
        { id: 'portal', label: 'Reservar', icon: 'sports_soccer' },
        { id: 'payment', label: 'Pago', icon: 'credit_card' },
        { id: 'bookings', label: 'Mis turnos', icon: 'event_available' },
        { id: 'login', label: 'Perfil', icon: 'person' },
      ];

  return (
    <div className="b2b-app">
      <MobileTopBar
        variant="canchas"
        brand="Sistema Canchas"
        title={orgName || 'Sistema Canchas'}
        actions={[{ icon: 'logout', label: 'Salir', onClick: () => { useB2bStore.getState().logout(); navigate('login'); } }]}
      />
      <aside className={`b2b-sidebar ${mobileMenu ? 'is-open' : ''}`}>
        <div className="b2b-brand">
          <div className="b2b-brand-mark"><span>SC</span></div>
          <div><strong>Sistema<br />Canchas</strong><small>B2B FACILITY SUITE</small></div>
        </div>
                        <div className="b2b-venue"><span>COMPLEJO ACTIVO</span><strong>{orgName || 'Sin organización'}</strong><small>Online</small><em>● Online</em></div>
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
        <div className="b2b-sidebar-bottom"><button className="product-link" onClick={() => { window.location.href = '/dt'; }}><Trophy size={18} /><span><strong>El Pizarrón del DT</strong><small>Estrategias & Táctica</small></span><ArrowRight size={15} /></button><div className="b2b-user"><div className="avatar"><UserRound size={17} /></div><span><strong>{formatRole(role)}</strong><small>{user?.email ?? 'Sin email'}</small></span><LogOut size={16} /></div></div>
      </aside>
      <main className="b2b-main">
        <header className="b2b-topbar"><button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menú"><Menu size={22} /></button><div className="b2b-breadcrumb"><span>Complejo</span><strong>{orgName || '—'}</strong><span>/</span><strong>{isStaff ? 'Jornada Diaria' : 'Reservar cancha'}</strong></div><div className="b2b-top-actions"><span className="live-status">● {isStaff ? 'Abierto' : 'Listo para reservar'}</span><B2bNotificationBell /><button className="profile-button" onClick={() => navigate('login')}><UserRound size={16} /> {formatRole(role)}</button></div></header>
        {isStaff ? <StaffView view={view} onNavigate={navigate} onSelectBooking={setSelectedBooking} /> : <RealClientView view={view} onNavigate={navigate} />}
      </main>
      <MobileTabBar variant="canchas" tabs={mobileTabs} activeTab={view} onSelect={(next) => navigate(next)} />
      {selectedBooking && <BookingDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} onAction={async (action) => { if (selectedBooking.id) { if (action === 'confirm') await b2bService.confirmBooking(selectedBooking.id); if (action === 'cancel') await b2bService.cancelBooking(selectedBooking.id); } setSelectedBooking(null); }} />}
      <B2bNotificationToasts />
    </div>
  );
}

function B2bLogin({ onEnter, onRegisterClient }: {
  onEnter: (email: string, password: string) => Promise<void>;
  onRegisterClient: (input: { email: string; fullName: string; password: string }) => Promise<void>;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const authError = useB2bStore((state) => state.error);
  const isLoading = useB2bStore((state) => state.isLoading);
  const clearError = useB2bStore((state) => state.clearError);

  const isRegister = mode === 'register';

  const switchMode = () => {
    clearError();
    setValidationError(null);
    setPassword('');
    setConfirmPassword('');
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleSubmit = async () => {
    clearError();
    setValidationError(null);

    if (mode === 'register') {
      // Registro de CLIENTE: se suma al sistema y luego elige en qué complejo reservar.
      if (fullName.trim().length < 3) { setValidationError('Ingresá tu nombre completo.'); return; }
      if (email.trim().length < 3 || !email.includes('@')) { setValidationError('Ingresá un email válido.'); return; }
      if (password.length < 6) { setValidationError('La contraseña debe tener al menos 6 caracteres.'); return; }
      if (password !== confirmPassword) { setValidationError('Las contraseñas no coinciden.'); return; }
      await onRegisterClient({ email: email.trim(), fullName: fullName.trim(), password });
      return;
    }

    if (email.trim().length === 0 || password.length === 0) { setValidationError('Ingresá tu email y contraseña.'); return; }
    await onEnter(email.trim(), password);
  };

  return (
    <div className="b2b-login">
      <div className="b2b-login-card">
        <div className="b2b-brand b2b-login-brand">
          <div className="b2b-brand-mark"><span>SC</span></div>
          <div><strong>Sistema<br />Canchas</strong><small>B2B FACILITY SUITE</small></div>
        </div>
        <div className="b2b-login-copy">
          <span>{isRegister ? 'Cuenta de cliente' : 'Acceso seguro'}</span>
          <h1>{isRegister ? (<>Tu cancha,<br /><em>a un clic.</em></>) : (<>Tu complejo,<br /><em>bajo control.</em></>)}</h1>
          <p>{isRegister ? 'Creá tu cuenta para reservar turnos en cualquier complejo.' : 'Gestioná canchas, reservas y recaudación desde un solo lugar.'}</p>
        </div>

        <form className="b2b-login-form" onSubmit={(event) => { event.preventDefault(); void handleSubmit(); }}>
          {isRegister && <label className="field-label">Nombre y apellido</label>}
          {isRegister && <input className="b2b-input" type="text" placeholder="Nombre completo" value={fullName} onChange={(event) => setFullName(event.target.value)} />}

          <label className="field-label">Email</label>
          <input className="b2b-input" type="email" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />

          <label className="field-label">Contraseña</label>
          <input className="b2b-input" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} />

          {isRegister && <label className="field-label">Confirmar contraseña</label>}
          {isRegister && <input className="b2b-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />}

          {(validationError || authError) && <p className="login-error" role="alert">{validationError || authError}</p>}

          <button type="submit" className="primary-action wide" disabled={isLoading}>
            {isLoading ? 'Procesando...' : isRegister ? 'Crear mi cuenta' : 'Ingresar al sistema'}
          </button>
        </form>

        <p className="login-footnote">
          {isRegister ? '¿Ya tenés una cuenta?' : '¿Todavía no tenés cuenta?'}{' '}
          <a href="#" onClick={(event) => { event.preventDefault(); switchMode(); }}>{isRegister ? 'Iniciar sesión' : 'Crear una cuenta'}</a>
        </p>
      </div>
      <div className="b2b-login-visual"><div className="visual-overlay"><span>OPERACIÓN EN VIVO</span><h2>Más reservas.<br />Menos complicaciones.</h2><p>La herramienta que tu complejo necesita para crecer.</p></div></div>
    </div>
  );
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
  return <div className="b2b-content"><div className="b2b-page-heading"><div><span className="eyebrow"><i /> OPERACIÓN EN VIVO</span><h1>Dashboard Operativo</h1><p>Jornada en curso — Buenos Aires, ART</p></div><div className="heading-actions"><button className="secondary-action" onClick={() => onNavigate('availability')}><SlidersHorizontal size={16} /> Administrar canchas</button><button className="primary-action" onClick={() => onNavigate('bookings')}>＋ Nueva reserva</button></div></div><div className="b2b-filter-row"><div className="court-tabs"><button className="active">Todas las canchas</button></div><button className="date-button"><CalendarDays size={16} /> Hoy<ChevronDown size={15} /></button></div><OperationalMetrics /><div className="operations-grid"><section className="panel schedule-panel"><div className="panel-heading"><div><h2>Agenda de turnos · Jornada hoy</h2><small>{bookingRows.length} turnos visibles</small></div><button className="text-button" onClick={() => onNavigate('availability')}>Vista cronológica <ArrowRight size={15} /></button></div><div className="schedule-table"><div className="schedule-head"><span>Horario</span><span>Cancha / Formato</span><span>Cliente / Reserva</span><span>Estado</span><span>Importe</span></div>{bookingRows.length === 0 && <div className="empty-state">No hay turnos registrados para hoy.</div>}{bookingRows.slice(0, 10).map((booking) => <button className="schedule-row" key={`${booking.time}-${booking.court}-${booking.client}`} onClick={() => onSelectBooking(booking)}><span><strong>{booking.time}</strong><small>24 Oct</small></span><span><strong>{booking.court}</strong><small>{booking.type}</small></span><span>{booking.client}</span><StatusBadge status={booking.status} /><span>{booking.price}</span><ArrowRight size={15} /></button>)}</div></section><aside className="side-stack"><section className="panel live-panel"><div className="panel-heading"><h2>Estado actual en vivo</h2><span className="muted">Sin datos en vivo</span></div><div className="availability-empty">No hay información en vivo disponible.</div></section></aside></div></div>;
}

function StatusBadge({ status }: { status: string }) { return <span className={`status-badge ${status.toLowerCase()}`}><i />{statusLabels[status] || status}</span>; }

function AvailabilityView({ onNavigate }: { onNavigate: (view: B2bView) => void }) {
  return <div className="b2b-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> DISPONIBILIDAD OPERATIVA</span><h1>Disponibilidad de canchas</h1><p>Seleccioná una fecha para administrar los turnos del complejo.</p></div><button className="primary-action" onClick={() => onNavigate('bookings')}>＋ Nueva reserva</button></div><div className="availability-toolbar"><button><ArrowLeft size={16} /></button><strong>Hoy</strong><button><ArrowRight size={16} /></button><select><option>Cargando…</option></select></div><section className="panel availability-panel"><div className="availability-legend"><span><i className="available" /> Libre</span><span><i className="confirmed" /> Reservado</span><span><i className="pending" /> Pendiente</span><span><i className="blocked" /> Bloqueado</span></div><div className="availability-empty">No hay canchas disponibles para mostrar.</div></section></div>;
}

function BookingsView({ bookingRows, onNavigate, onSelectBooking }: { bookingRows: BookingRow[]; onNavigate: (view: B2bView) => void; onSelectBooking: (booking: BookingRow) => void }) { return <div className="b2b-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> GESTIÓN OPERATIVA</span><h1>Bandeja de reservas</h1><p>Revisá y gestioná las solicitudes del complejo.</p></div><button className="primary-action" onClick={() => onNavigate('portal')}>＋ Nueva reserva</button></div><div className="booking-summary"><strong>{bookingRows.length} reservas visibles</strong><span>Estados sincronizados</span><div className="search-bookings">Buscar cliente o reserva...</div></div><section className="panel booking-list"><div className="booking-list-head"><span>Turno</span><span>Cliente</span><span>Cancha</span><span>Estado</span><span>Importe</span><span /></div>{bookingRows.slice(0, 10).map((booking) => <button className="booking-list-row" key={`${booking.client}-${booking.time}`} onClick={() => onSelectBooking(booking)}><span><strong>{booking.time}</strong></span><span><strong>{booking.client}</strong><small>Reserva online</small></span><span>{booking.court}<small>{booking.type}</small></span><StatusBadge status={booking.status} /><span><strong>{booking.price}</strong><small>ARS</small></span><ArrowRight size={17} /></button>)}</section></div>; }

function RealClientView({ view, onNavigate }: { view: B2bView; onNavigate: (view: B2bView) => void }) {
  const [organizations, setOrganizations] = useState<B2bOrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [courts, setCourts] = useState<Array<{ id: string; name: string; sportType: string; defaultPriceCentsArs: number }>>([]);
  const [shifts, setShifts] = useState<Array<{ id: string; courtId: string; startsAt: string; endsAt: string; priceCentsArs: number }>>([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    b2bService.getPublicOrganizations()
      .then((items) => {
        setOrganizations(items);
        if (items.length > 0) setOrganizationId(items[0].id);
      })
      .catch(() => setMessage('No se pudieron cargar los complejos.'));
  }, []);
  useEffect(() => {
    if (!organizationId) return;
    setMessage('');
    setCourts([]);
    setShifts([]);
    const from = new Date();
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    b2bService.getPublicCourts(organizationId)
      .then(async (loadedCourts: Array<{ id: string; name: string; sportType: string; capacity: number; defaultPriceCentsArs: number }>) => {
        setCourts(loadedCourts);
        const results = await Promise.allSettled(loadedCourts.map((court) => b2bService.getAvailability(court.id, from.toISOString(), to.toISOString())));
        setShifts(results.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled').flatMap((result) => result.value));
      })
      .catch(() => setMessage('No se pudieron cargar las canchas de este complejo.'));
  }, [organizationId]);
    const selectedOrgName = organizations.find((org) => org.id === organizationId)?.name ?? '';
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [duration, setDuration] = useState<1 | 2>(1);
  const [selectedShift, setSelectedShift] = useState<{ courtName: string; courtId: string; shiftId?: string; label: string; priceCents: number } | null>(null);
  const finishPayment = () => {
    setSelectedDate('');
    setSelectedShift(null);
    setDuration(1);
    setMessage('Reserva registrada. El complejo confirmará tu turno.');
    onNavigate('portal');
  };
  if (view === 'payment') return <PaymentView onNavigate={onNavigate} onComplete={finishPayment} />;
    const demoCourts = courts.length ? courts : [{ id: 'placeholder', name: 'Sin canchas todavía', sportType: 'Seleccioná un complejo', defaultPriceCentsArs: 0 }];
  const reserve = async (courtId: string, shiftId?: string) => {
    if (!shiftId) { setMessage('Seleccioná un turno disponible.'); return; }
    const result = await b2bService.createBooking({ courtId, shiftId }).catch(() => null);
    if (result) {
      setMessage('Turno reservado correctamente.');
      onNavigate('payment');
    } else {
      setMessage('No se pudo reservar el turno. Intentalo de nuevo.');
    }
  };
  const toDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const activeDay = selectedDate || (weekDays[0] ? toDayKey(weekDays[0]) : '');
  const durationLabel = duration === 1 ? '1 hora' : '2 horas';
  const selectedTotalCents = selectedShift ? selectedShift.priceCents * duration : 0;
  const confirmSelection = () => {
    if (selectedShift) void reserve(selectedShift.courtId, selectedShift.shiftId);
    else setMessage('Seleccioná un turno disponible para continuar al pago.');
  };
  return <div className="b2b-content client-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> PORTAL CLIENTE</span><h1>Reservá tu cancha</h1><p>Elegí el complejo, horario y duración de tu turno.</p></div><div className="client-chip"><UserRound size={15} /> Cliente autenticado</div></div>{message && <p className="settings-feedback">{message}</p>}<div className="client-booking-layout"><section className="panel client-selector"><div className="selector-block"><label>Complejo</label><select className="b2b-input" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>{organizations.length === 0 && <option value="">Cargando complejos…</option>}{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></div><div className="selector-block"><label>Fecha</label><div className="flex flex-wrap gap-2">{weekDays.map((d) => { const key = toDayKey(d); const isActive = activeDay === key; return <button key={key} onClick={() => { setSelectedDate(key); setSelectedShift(null); }} className={`min-h-11 px-3 rounded-lg border text-xs font-label-md ${isActive ? 'bg-[#15803d] text-white border-[#15803d]' : 'bg-white text-slate-600 border-slate-200'}`}>{d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' })}</button>; })}</div></div><div className="selector-block"><label>Duración</label><div className="duration-toggle"><button className={duration === 1 ? 'active' : ''} onClick={() => setDuration(1)}>1 hora</button><button className={duration === 2 ? 'active' : ''} onClick={() => setDuration(2)}>2 horas</button></div></div><h2>Turnos disponibles</h2><div className="client-court-list">{demoCourts.map((court) => { const courtShifts = shifts.filter((shift) => shift.courtId === court.id && toDayKey(new Date(shift.startsAt)) === activeDay).slice(0, 4); return <div className="client-court" key={court.id}><span><strong>{court.name} · {court.sportType}</strong><small>Superficie sintética · Precio desde ${(court.defaultPriceCentsArs / 100).toLocaleString('es-AR')} ARS</small></span><div className="flex flex-wrap gap-2">{(courtShifts.length ? courtShifts : []).map((shift) => { const isSel = selectedShift?.shiftId === shift.id; const label = new Date(shift.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); return <button key={`${court.id}-${shift.id || 'shift'}`} className={isSel ? 'selected' : ''} onClick={() => setSelectedShift({ courtName: court.name, courtId: court.id, shiftId: shift.id, label, priceCents: shift.priceCentsArs })}>{label}<small>$ {(shift.priceCentsArs / 100).toLocaleString('es-AR')}</small></button>; })}</div>{courtShifts.length === 0 && <small className="text-slate-400">Sin turnos para este día.</small>}</div>; })}</div></section><aside className="panel booking-receipt"><span className="eyebrow">RESUMEN DEL TURNO</span><h2>Tu reserva</h2><div className="receipt-row"><span>Complejo</span><strong>{selectedOrgName || 'Seleccioná un complejo'}</strong></div><div className="receipt-row"><span>Cancha</span><strong>{selectedShift?.courtName || 'Elegí un turno'}</strong></div><div className="receipt-row"><span>Horario</span><strong>{selectedShift?.label || '—'}</strong></div><div className="receipt-row"><span>Duración</span><strong>{durationLabel}</strong></div><div className="receipt-total"><span>Total estimado</span><strong>$ {(selectedTotalCents / 100).toLocaleString('es-AR')} ARS</strong></div><button className="primary-action wide hidden md:inline-flex" disabled={!selectedShift} onClick={confirmSelection}><Check size={16} /> Continuar a Pago</button><small className="receipt-note">Se requiere una cuenta autenticada para reservar.</small></aside></div>{selectedShift && <div className="mobile-sticky-bar md:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-6px_20px_rgba(15,23,42,0.12)]"><div className="min-w-0"><div className="text-xs text-slate-500 truncate">{selectedShift.courtName} · {selectedShift.label} · {durationLabel}</div><div className="font-bold text-[#15803d]">$ {(selectedTotalCents / 100).toLocaleString('es-AR')} ARS</div></div><button className="shrink-0 min-h-11 px-5 rounded-lg bg-[#15803d] text-white font-bold text-sm" onClick={confirmSelection}>Continuar a Pago</button></div>}</div>;

}

function SettingsView() {
  const [tab, setTab] = useState<'facilities' | 'courts' | 'rules'>('facilities');
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; address?: string | null; status: string }>>([]);
  const [courts, setCourts] = useState<Array<{ id: string; facilityId: string; name: string; sportType: string; capacity: number; defaultPriceCentsArs: number }>>([]);
  const [name, setName] = useState('');
  const [courtName, setCourtName] = useState('');
  const [courtPrice, setCourtPrice] = useState('');
  const [courtSportType, setCourtSportType] = useState('FUTBOL 7');
  const [courtFacilityId, setCourtFacilityId] = useState('');
  const [showCourtForm, setShowCourtForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    Promise.all([b2bService.getFacilities(), b2bService.getCourts()]).then(([loadedFacilities, loadedCourts]) => {
      setFacilities(loadedFacilities);
      setCourts(loadedCourts);
    })    .catch(() => setFeedback('No se pudieron cargar los datos. Intentalo de nuevo.'));
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
  const addCourt = async () => {
    const priceCents = Math.round(parseFloat(courtPrice) * 100);
    if (!courtName.trim() || !priceCents || priceCents <= 0) { setFeedback('Completá el nombre y un precio válido para la cancha.'); return; }
    if (!courtFacilityId) { setFeedback('Elegí el complejo donde vas a agregar la cancha.'); return; }
    const facility = facilities.find((item) => item.id === courtFacilityId);
    try {
      const created = await b2bService.createCourt(courtFacilityId, { name: courtName.trim(), sportType: courtSportType, defaultPriceCentsArs: priceCents });
      setCourts((current) => [...current, created]);
      setCourtName('');
      setCourtPrice('');
      setShowCourtForm(false);
      setFeedback(`Cancha "${created.name}" agregada a ${facility?.name ?? 'tu complejo'}.`);
    } catch { setFeedback('No se pudo crear la cancha. Verificá que el complejo exista.'); }
  };
  const updateCourtPrice = async (court: { id: string; name: string; defaultPriceCentsArs: number }) => {
    const newPrice = prompt(`Precio actual: $${Math.round(court.defaultPriceCentsArs / 100).toLocaleString('es-AR')} ARS\nNuevo precio por hora (ARS):`, String(Math.round(court.defaultPriceCentsArs / 100)));
    if (newPrice === null) return;
    const priceCents = Math.round(parseFloat(newPrice) * 100);
    if (!priceCents || priceCents <= 0) { setFeedback('Ingresá un precio válido.'); return; }
    try {
      await b2bService.updateCourt(court.id, { defaultPriceCentsArs: priceCents });
      setCourts((current) => current.map((item) => item.id === court.id ? { ...item, defaultPriceCentsArs: priceCents } : item));
      setFeedback(`Precio de \"${court.name}\" actualizado.`);
    } catch { setFeedback('No se pudo actualizar el precio.'); }
  };
  return (
    <div className="b2b-content">
      <div className="b2b-page-heading compact">
        <div>
          <span className="eyebrow"><i /> CONFIGURACIÓN OPERATIVA</span>
          <h1>Complejos, canchas y horarios</h1>
          <p>Administrá la operación del espacio en ARS y ART.</p>
        </div>
      </div>
      <div className="settings-tabs">
        <button className={tab === 'facilities' ? 'active' : ''} onClick={() => setTab('facilities')}>Complejos</button>
        <button className={tab === 'courts' ? 'active' : ''} onClick={() => setTab('courts')}>Canchas</button>
        <button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>Horarios y bloqueos</button>
      </div>
      {feedback && <p className="settings-feedback">{feedback}</p>}
      {tab === 'facilities' && (
        <section className="panel settings-panel">
          <div className="settings-panel-head">
            <div><h2>Complejos deportivos</h2><small>Un espacio aislado por organización.</small></div>
            <div className="inline-form">
              <input className="b2b-input" placeholder="Nombre del complejo" value={name} onChange={(event) => setName(event.target.value)} />
              <button className="primary-action" onClick={addFacility}>＋ Agregar</button>
            </div>
          </div>
          <div className="settings-list">
            {facilities.map((facility) => (
              <div className="settings-row" key={facility.id}>
                <span className="settings-icon"><Trophy size={16} /></span>
                <span><strong>{facility.name}</strong><small>{facility.address || 'Sin dirección configurada'}</small></span>
                <StatusBadge status={facility.status === 'ACTIVE' ? 'CONFIRMED' : 'CANCELLED'} />
                <button className="icon-button" title="Editar complejo">⋮</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === 'courts' && (
        <section className="panel settings-panel">
          <div className="settings-panel-head">
            <div><h2>Canchas registradas</h2><small>Precios expresados en ARS.</small></div>
            <button className="primary-action" onClick={() => setShowCourtForm((open) => !open)}>＋ Agregar cancha</button>
          </div>
          {showCourtForm && (
            <div className="settings-court-form-panel">
              <span className="settings-form-title">Nueva cancha</span>
              <div className="inline-form settings-court-form">
                <input className="b2b-input" placeholder="Nombre de la cancha" value={courtName} onChange={(event) => setCourtName(event.target.value)} />
                <select className="b2b-input" value={courtFacilityId} onChange={(event) => setCourtFacilityId(event.target.value)}>
                  {facilities.length === 0 && <option value="">Sin complejos</option>}
                  {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
                </select>
                <select className="b2b-input" value={courtSportType} onChange={(event) => setCourtSportType(event.target.value)}>
                  <option value="FUTBOL 5">Fútbol 5</option>
                  <option value="FUTBOL 7">Fútbol 7</option>
                  <option value="FUTBOL 8">Fútbol 8</option>
                  <option value="FUTBOL 11">Fútbol 11</option>
                </select>
                <input className="b2b-input" placeholder="Precio x hora (ARS)" value={courtPrice} onChange={(event) => setCourtPrice(event.target.value)} />
                <button className="primary-action" disabled={!facilities.length} onClick={addCourt}>Guardar cancha</button>
              </div>
              {!facilities.length && <p className="settings-feedback caveat">Primero creá un complejo para poder agregar canchas.</p>}
            </div>
          )}
          <div className="settings-list">
            {courts.map((court) => (
              <div className="settings-row" key={court.id}>
                <span className="settings-icon"><Trophy size={16} /></span>
                <span><strong>{court.name}</strong><small>{facilities.find((item) => item.id === court.facilityId)?.name ?? '—'} · {court.sportType} · Capacidad {court.capacity}</small></span>
                <strong className="settings-price">$ {(court.defaultPriceCentsArs / 100).toLocaleString('es-AR')} ARS</strong>
                <button className="secondary-action" onClick={() => updateCourtPrice(court)}>Editar</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === 'rules' && <ScheduleSettings courts={courts} />}
    </div>
  );
}


function PaymentView({ onNavigate, onComplete }: { onNavigate: (view: B2bView) => void; onComplete: () => void }) {
  const [modality, setModality] = useState<'deposit' | 'total'>('deposit');
  const [method, setMethod] = useState<'mercadopago' | 'transfer'>('mercadopago');
  const [holder, setHolder] = useState('');
  const label = modality === 'deposit' ? 'Pagar seña (30%)' : 'Pagar total';
  return (
    <div className="b2b-content client-content">
      <button className="back-link" onClick={() => onNavigate('portal')}><ArrowLeft size={16} /> Volver al portal</button>
      <div className="payment-layout">
        <section className="panel payment-card">
          <div className="success-icon"><Check size={28} /></div>
          <span className="eyebrow">CONFIRMACIÓN DE TURNO</span>
          <h1>Tu turno está listo</h1>
          <p>Revisá los datos antes de confirmar la reserva.</p>
          <div className="payment-steps"><span className="done">1. Turno</span><span className="active">2. Pago</span><span>3. Confirmación</span></div>
          <div className="payment-detail"><span>Resumen de reserva</span><strong>Reserva confirmada</strong><small>Los datos del turno se cargarán desde tu historial de reservas.</small></div>
          <div className="selector-block"><label>Modalidad de pago</label><div className="duration-toggle"><button className={modality === 'deposit' ? 'active' : ''} onClick={() => setModality('deposit')}>Seña (30%)</button><button className={modality === 'total' ? 'active' : ''} onClick={() => setModality('total')}>Pago total</button></div></div>
          <div className="selector-block"><label>Medio de pago</label><div className="duration-toggle"><button className={method === 'mercadopago' ? 'active' : ''} onClick={() => setMethod('mercadopago')}>Mercado Pago</button><button className={method === 'transfer' ? 'active' : ''} onClick={() => setMethod('transfer')}>Transferencia</button></div></div>
          <div className="selector-block"><label>Nombre del titular</label><input className="b2b-input" placeholder="Como figura en la tarjeta" value={holder} onChange={(event) => setHolder(event.target.value)} /></div>
          <div className="receipt-total"><span>Total</span><strong>{label}</strong></div>
          <button className="primary-action wide hidden md:inline-flex" onClick={onComplete}><Check size={16} /> {label}</button>
          <p className="payment-note">La integración con una pasarela de pagos se agregará en una etapa posterior.</p>
        </section>
      </div>
      <div className="mobile-sticky-bar md:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-6px_20px_rgba(15,23,42,0.12)]"><div className="min-w-0"><div className="text-xs text-slate-500">Modalidad</div><div className="font-bold text-[#15803d]">{label}</div></div><button className="shrink-0 min-h-11 px-5 rounded-lg bg-[#15803d] text-white font-bold text-sm" onClick={onComplete}>{label}</button></div>
    </div>
  );
}
function BookingDrawer({ booking, onClose, onAction }: { booking: BookingRow; onClose: () => void; onAction: (action: 'confirm' | 'cancel') => Promise<void> }) { return <div className="drawer-backdrop" onClick={onClose}><aside className="booking-drawer" onClick={(event) => event.stopPropagation()}><button className="close-drawer" onClick={onClose}><X size={18} /></button><span className="eyebrow">DETALLE DE RESERVA</span><h2>{booking.client}</h2><StatusBadge status={booking.status} /><div className="drawer-details"><span><Clock3 size={16} />{booking.time}</span><span><CalendarDays size={16} /> Reserva online</span><span><Trophy size={16} />{booking.court} · {booking.type}</span><span><CircleDollarSign size={16} />{booking.price} ARS</span></div><div className="drawer-actions"><button className="secondary-action" onClick={() => onAction('cancel')}>Cancelar</button><button className="primary-action" onClick={() => onAction('confirm')}>Confirmar reserva</button></div></aside></div>; }