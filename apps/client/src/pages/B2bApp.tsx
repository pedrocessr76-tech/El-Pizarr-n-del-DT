import { ScheduleSettings } from '../components/b2b/ScheduleSettings';

import { OperationalMetrics } from '../components/b2b/OperationalMetrics';

import { ProfileView } from '../components/b2b/ProfileView';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  SlidersHorizontal,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useB2bStore } from '../store/useB2bStore';
import { b2bService, buildWhatsAppDeepLink, type B2bBooking, type B2bOrganizationOption, type B2bPublicFacility, type B2bWeeklyAvailability } from '../services/b2bService';
import { MobileTopBar } from '../components/layout/MobileTopBar';
import { MobileTabBar, type MobileTab } from '../components/layout/MobileTabBar';
import { useB2bNotificationSocket } from '../services/b2bNotificationSocket';
import { B2bNotificationBell } from '../components/b2b/B2bNotificationBell';
import { B2bNotificationToasts } from '../components/b2b/B2bNotificationToasts';
import { addOrgDays, dayKeyToOrgMidnight, formatDayLabel, formatHourLabel, formatWeekdayLabel, orgTzLabel, resolveOrgTimeZone, startOfOrgDay, startOfWeekKey, toDayKey } from '../utils/orgTime';

type B2bRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'CLIENT';
type B2bView = 'login' | 'dashboard' | 'availability' | 'bookings' | 'settings' | 'schedule' | 'portal' | 'payment' | 'profile';

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
  dateKey: string;
  dateLabel: string;
  courtId?: string;
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
  const roles = (user.roles ?? []).map((r) => r.toUpperCase());
  for (const candidate of ['OWNER', 'ADMIN', 'OPERATOR'] as const) {
    if (roles.includes(candidate)) return candidate;
  }
  return 'CLIENT';
}

export function B2bApp() {
  useB2bNotificationSocket();
  const user = useB2bStore((state) => state.user);
  // Issue #24: todos los horarios se muestran e interpretan en la zona horaria
  // de la organización, no con la zona del navegador ni del servidor.
  const orgTimezone = useB2bStore((state) => state.orgTimezone);
  const timezone = resolveOrgTimeZone(orgTimezone);
  const [view, setView] = useState<B2bView>(() => {
    const stored = useB2bStore.getState().user;
    if (!stored) return 'login';
    return resolveRole(stored) === 'CLIENT' ? 'portal' : 'dashboard';
  });
  const role = resolveRole(user);
  const isStaff = role !== 'CLIENT';
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const login = useB2bStore((state) => state.login);
  const registerClient = useB2bStore((state) => state.registerClient);
  const onboardOwner = useB2bStore((state) => state.onboardOwner);

  // Restaura la sesión B2B desde la cookie HttpOnly al entrar a /canchas
  // (issue #17): el token ya no se persiste, la sesión larga viaja en cookie.
  // La zona horaria de la organización se carga como parte del arranque para
  // que las vistas ya rendericen todos sus horarios con la tz correcta (#24).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add('b2b-route');
    document.body.classList.add('b2b-route');
    return () => {
      document.documentElement.classList.remove('b2b-route');
      document.body.classList.remove('b2b-route');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setHydrated(true);
    };
    // Si el refresh se cuelga (p. ej. interceptor reentrante), no dejar la ruta
    // en blanco sobre el fondo verde del juego.
    const failSafe = window.setTimeout(finish, 6000);
    void useB2bStore.getState().hydrate()
      .then(async (restored) => {
        if (cancelled) return;
        if (restored) {
          await useB2bStore.getState().loadOrgTimezone();
          if (cancelled) return;
          setView(resolveRole(useB2bStore.getState().user) === 'CLIENT' ? 'portal' : 'dashboard');
        }
      })
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(failSafe);
        finish();
      });
    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
    };
  }, []);

  // Recarga la zona cuando la sesión cambia (login/registro dentro del app).
  useEffect(() => {
    if (user) void useB2bStore.getState().loadOrgTimezone();
  }, [user]);

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
    navigate(nextRole === 'CLIENT' ? 'portal' : 'dashboard');
  };

  const registerClientAccount = async (input: { email: string; fullName: string; password: string }) => {
    const created = await registerClient(input);
    if (!created) return;
    // Un cliente recién registrado entra a su portal: ahí elige en qué complejo reservar.
    navigate('portal');
  };

  const registerOwnerAccount = async (input: { organizationName: string; facilityName?: string; ownerFullName: string; email: string; password: string }) => {
    const created = await onboardOwner(input);
    if (!created) return;
    // El propietario recién dado de alta entra directo a su dashboard operativo.
    navigate('dashboard');
  };

  if (!hydrated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#15803d', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <small>Cargando Sistema Canchas…</small>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return <B2bLogin onEnter={enterB2b} onRegisterClient={registerClientAccount} onRegisterOwner={registerOwnerAccount} />;
  }

  const mobileTabs: MobileTab<B2bView>[] = isStaff
    ? [
        { id: 'dashboard', label: 'Operativa', icon: 'dashboard' },
        { id: 'availability', label: 'Canchas', icon: 'calendar_month' },
        { id: 'bookings', label: 'Reservas', icon: 'groups' },
        { id: 'profile', label: 'Perfil', icon: 'person' },
      ]
    : [
        { id: 'portal', label: 'Reservar', icon: 'sports_soccer' },
        { id: 'payment', label: 'Pago', icon: 'credit_card' },
        { id: 'bookings', label: 'Mis turnos', icon: 'event_available' },
        { id: 'profile', label: 'Perfil', icon: 'person' },
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
        <nav className="b2b-nav">
          <span>MÓDULOS DE GESTIÓN</span>
          {isStaff ? <>
            <B2bNavButton icon={<LayoutDashboard size={17} />} label="Dashboard" active={view === 'dashboard'} onClick={() => navigate('dashboard')} />
            <B2bNavButton icon={<Trophy size={17} />} label="Complejos y Canchas" active={view === 'settings'} onClick={() => navigate('settings')} />
            <B2bNavButton icon={<CalendarDays size={17} />} label="Disponibilidad" active={view === 'availability'} onClick={() => navigate('availability')} />
            <B2bNavButton icon={<UsersRound size={17} />} label="Reservas" active={view === 'bookings'} onClick={() => navigate('bookings')} />
            <B2bNavButton icon={<SlidersHorizontal size={17} />} label="Horarios y Configuración" active={view === 'schedule'} onClick={() => navigate('schedule')} />
          </> : <B2bNavButton icon={<CalendarDays size={17} />} label="Reservar cancha" active={view === 'portal'} onClick={() => navigate('portal')} />}
        </nav>
        <div className="b2b-sidebar-bottom"><button className="product-link" onClick={() => { window.location.href = '/dt'; }}><Trophy size={18} /><span><strong>El Pizarrón del DT</strong><small>Estrategias & Táctica</small></span><ArrowRight size={15} /></button><div className="b2b-user"><div className="avatar"><UserRound size={17} /></div><span><strong>{formatRole(role)}</strong><small>{user?.email ?? 'Sin email'}</small></span><LogOut size={16} /></div></div>
      </aside>
      <main className="b2b-main">
        <header className="b2b-topbar"><button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menú"><Menu size={22} /></button><div className="b2b-breadcrumb"><span>Complejo</span><strong>{orgName || '—'}</strong><span>/</span><strong>{isStaff ? 'Jornada Diaria' : 'Reservar cancha'}</strong></div><div className="b2b-top-actions"><span className="live-status">● {isStaff ? 'Abierto' : 'Listo para reservar'}</span><B2bNotificationBell /><button className="profile-button" onClick={() => navigate('profile')}><UserRound size={16} /> {formatRole(role)}</button></div></header>
        {isStaff ? <StaffView view={view} onNavigate={navigate} onSelectBooking={setSelectedBooking} timezone={timezone} /> : <RealClientView view={view} onNavigate={navigate} timezone={timezone} />}
      </main>
      <MobileTabBar variant="canchas" tabs={mobileTabs} activeTab={view} onSelect={(next) => navigate(next)} />
      {selectedBooking && <BookingDrawer booking={selectedBooking} timezone={timezone} onClose={() => setSelectedBooking(null)} onAction={async (action) => { if (selectedBooking.id) { if (action === 'confirm') await b2bService.confirmBooking(selectedBooking.id); if (action === 'cancel') await b2bService.cancelBooking(selectedBooking.id); } setSelectedBooking(null); }} />}
      <B2bNotificationToasts />
    </div>
  );
}

function B2bLogin({ onEnter, onRegisterClient, onRegisterOwner }: {
  onEnter: (email: string, password: string) => Promise<void>;
  onRegisterClient: (input: { email: string; fullName: string; password: string }) => Promise<void>;
  onRegisterOwner: (input: { organizationName: string; facilityName?: string; ownerFullName: string; email: string; password: string }) => Promise<void>;
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'register-owner'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const authError = useB2bStore((state) => state.error);
  const isLoading = useB2bStore((state) => state.isLoading);
  const clearError = useB2bStore((state) => state.clearError);

  const isRegister = mode === 'register';
  const isOwnerOnboarding = mode === 'register-owner';

  const switchMode = (next: 'login' | 'register' | 'register-owner') => {
    clearError();
    setValidationError(null);
    setPassword('');
    setConfirmPassword('');
    setMode(next);
  };

  const handleSubmit = async () => {
    clearError();
    setValidationError(null);

    if (isRegister) {
      // Registro de CLIENTE: se suma al sistema y luego elige en qué complejo reservar.
      if (fullName.trim().length < 3) { setValidationError('Ingresá tu nombre completo.'); return; }
      if (email.trim().length < 3 || !email.includes('@')) { setValidationError('Ingresá un email válido.'); return; }
      if (password.length < 6) { setValidationError('La contraseña debe tener al menos 6 caracteres.'); return; }
      if (password !== confirmPassword) { setValidationError('Las contraseñas no coinciden.'); return; }
      await onRegisterClient({ email: email.trim(), fullName: fullName.trim(), password });
      return;
    }

    if (isOwnerOnboarding) {
      // Onboarding de propietario: crea el complejo con su cuenta OWNER y una sede inicial.
      if (organizationName.trim().length < 3) { setValidationError('Ingresá el nombre de tu complejo.'); return; }
      if (fullName.trim().length < 3) { setValidationError('Ingresá el nombre del dueño.'); return; }
      if (email.trim().length < 3 || !email.includes('@')) { setValidationError('Ingresá un email válido.'); return; }
      if (password.length < 6) { setValidationError('La contraseña debe tener al menos 6 caracteres.'); return; }
      if (password !== confirmPassword) { setValidationError('Las contraseñas no coinciden.'); return; }
      await onRegisterOwner({
        organizationName: organizationName.trim(),
        facilityName: facilityName.trim() || undefined,
        ownerFullName: fullName.trim(),
        email: email.trim(),
        password,
      });
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
          <span>{isOwnerOnboarding ? 'Alta de propietario' : isRegister ? 'Cuenta de cliente' : 'Acceso seguro'}</span>
          <h1>{isOwnerOnboarding ? (<>Tu complejo,<br /><em>listo desde hoy.</em></>) : isRegister ? (<>Tu cancha,<br /><em>a un clic.</em></>) : (<>Tu complejo,<br /><em>bajo control.</em></>)}</h1>
          <p>{isOwnerOnboarding ? 'Creá tu complejo y una cuenta de propietario para gestionar canchas y reservas.' : isRegister ? 'Creá tu cuenta para reservar turnos en cualquier complejo.' : 'Gestioná canchas, reservas y recaudación desde un solo lugar.'}</p>
        </div>

        <form className="b2b-login-form" onSubmit={(event) => { event.preventDefault(); void handleSubmit(); }}>
          {isOwnerOnboarding && <label className="field-label">Nombre del complejo</label>}
          {isOwnerOnboarding && <input className="b2b-input" type="text" placeholder="Ej: Complejo Los Amigos" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />}

          {isOwnerOnboarding && <label className="field-label">Sede inicial (opcional)</label>}
          {isOwnerOnboarding && <input className="b2b-input" type="text" placeholder="Ej: Sede Central" value={facilityName} onChange={(event) => setFacilityName(event.target.value)} />}

          {(isRegister || isOwnerOnboarding) && <label className="field-label">{isOwnerOnboarding ? 'Nombre del dueño' : 'Nombre y apellido'}</label>}
          {(isRegister || isOwnerOnboarding) && <input className="b2b-input" type="text" placeholder={isOwnerOnboarding ? 'Nombre completo del dueño' : 'Nombre completo'} value={fullName} onChange={(event) => setFullName(event.target.value)} />}

          <label className="field-label">Email</label>
          <input className="b2b-input" type="email" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />

          <label className="field-label">Contraseña</label>
          <input className="b2b-input" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegister || isOwnerOnboarding ? 'new-password' : 'current-password'} />

          {(isRegister || isOwnerOnboarding) && <label className="field-label">Confirmar contraseña</label>}
          {(isRegister || isOwnerOnboarding) && <input className="b2b-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />}

          {(validationError || authError) && <p className="login-error" role="alert">{validationError || authError}</p>}

          <button type="submit" className="primary-action wide" disabled={isLoading}>
            {isLoading ? 'Procesando...' : isOwnerOnboarding ? 'Crear mi complejo' : isRegister ? 'Crear mi cuenta' : 'Ingresar al sistema'}
          </button>
        </form>

        <p className="login-footnote">
          {isOwnerOnboarding || isRegister
            ? <a href="#" onClick={(event) => { event.preventDefault(); switchMode('login'); }}>¿Ya tenés cuenta? Iniciar sesión</a>
            : <a href="#" onClick={(event) => { event.preventDefault(); switchMode('register'); }}>¿Sos cliente? Creá tu cuenta</a>}
        </p>
        <p className="login-footnote">
          {isOwnerOnboarding
            ? <a href="#" onClick={(event) => { event.preventDefault(); switchMode('register'); }}>¿Sos cliente? Creá tu cuenta</a>
            : <a href="#" onClick={(event) => { event.preventDefault(); switchMode('register-owner'); }}>¿Sos dueño de un complejo? Registralo</a>}
        </p>
      </div>
      <div className="b2b-login-visual"><div className="visual-overlay"><span>OPERACIÓN EN VIVO</span><h2>Más reservas.<br />Menos complicaciones.</h2><p>La herramienta que tu complejo necesita para crecer.</p></div></div>
    </div>
  );
}

function B2bNavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button className={`b2b-nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{active && <small>Hoy</small>}</button>;
}

function StaffView({ view, onNavigate, onSelectBooking, timezone }: { view: B2bView; onNavigate: (view: B2bView) => void; onSelectBooking: (booking: typeof bookings[number]) => void; timezone: string }) {
  const [bookingRows, setBookingRows] = useState<BookingRow[]>(bookings);
  useEffect(() => {
    b2bService.getBookings().then((items) => {
      if (!items.length) return;
      setBookingRows(items.map((item, index) => ({
        time: formatHourLabel(timezone, item.shiftStartsAt),
        dateKey: item.shiftStartsAt ? toDayKey(timezone, item.shiftStartsAt) : '',
        dateLabel: formatDayLabel(timezone, item.shiftStartsAt),
        courtId: item.courtId,
        court: item.courtName ?? `Cancha ${index + 1}`,
        type: item.courtSportType ?? 'Fútbol',
        id: item.id,
        client: item.clientName ?? item.clientUserId,
        status: item.status,
        price: `$ ${(item.priceCentsArs / 100).toLocaleString('es-AR')}`,
      })) as BookingRow[]);
    }).catch(() => undefined);
  }, []);
  if (view === 'availability') return <AvailabilityView onNavigate={onNavigate} timezone={timezone} />;
  if (view === 'bookings') return <BookingsView bookingRows={bookingRows} onNavigate={onNavigate} onSelectBooking={onSelectBooking} />;
  if (view === 'settings') return <SettingsView />;
  if (view === 'schedule') return <ScheduleView />;
  if (view === 'profile') return <ProfileView role="staff" onBack={() => onNavigate('dashboard')} />;
  return <DashboardView bookingRows={bookingRows} onNavigate={onNavigate} onSelectBooking={onSelectBooking} timezone={timezone} />;
}

function DashboardView({ bookingRows, onNavigate, onSelectBooking, timezone }: { bookingRows: BookingRow[]; onNavigate: (view: B2bView) => void; onSelectBooking: (booking: BookingRow) => void; timezone: string }) {
  const [filterDate, setFilterDate] = useState<string>(toDayKey(timezone, new Date()));
  // Si la zona carga con posterioridad al montaje (primer login), la fecha de
  // hoy se recalcula con la tz definitiva de la organización (#24).
  useEffect(() => {
    setFilterDate(toDayKey(timezone, new Date()));
  }, [timezone]);
  const [filterCourtId, setFilterCourtId] = useState('all');
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([]);
  const [courts, setCourts] = useState<Array<{ id: string; facilityId: string; name: string }>>([]);
  useEffect(() => {
    Promise.all([b2bService.getFacilities(), b2bService.getCourts()])
      .then(([loadedFacilities, loadedCourts]) => {
        setFacilities(loadedFacilities);
        setCourts(loadedCourts);
      })
      .catch(() => undefined);
  }, []);
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = addOrgDays(new Date(), i, timezone);
    const key = toDayKey(timezone, d);
    const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: timezone });
    return { key, label };
  });
  const filtered = bookingRows.filter((booking) => {
    if (!booking.dateKey || booking.dateKey !== filterDate) return false;
    if (filterCourtId !== 'all' && booking.courtId !== filterCourtId) return false;
    return true;
  });
  return <div className="b2b-content"><div className="b2b-page-heading"><div><span className="eyebrow"><i /> OPERACIÓN EN VIVO</span><h1>Dashboard Operativo</h1><p>Jornada en curso — {orgTzLabel(timezone)}</p></div><div className="heading-actions"><button className="secondary-action" onClick={() => onNavigate('availability')}><SlidersHorizontal size={16} /> Administrar canchas</button><button className="primary-action" onClick={() => onNavigate('bookings')}>＋ Nueva reserva</button></div></div><div className="b2b-filter-row"><div className="court-tabs"><button className={filterCourtId === 'all' ? 'active' : ''} onClick={() => setFilterCourtId('all')}>Todas las canchas</button>{courts.map((court) => <button key={court.id} className={filterCourtId === court.id ? 'active' : ''} onClick={() => setFilterCourtId(court.id)}>{court.name}</button>)}</div><label className="date-filter"><CalendarDays size={16} /><select value={filterDate} onChange={(event) => setFilterDate(event.target.value)} aria-label="Fecha del dashboard">{dateOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label></div><OperationalMetrics date={filterDate} courtId={filterCourtId === 'all' ? undefined : filterCourtId} /><div className="operations-grid"><section className="panel schedule-panel"><div className="panel-heading"><div><h2>Agenda de turnos <span className="schedule-date-label">{formatDayLabel(timezone, filterDate)}</span></h2><small>{filtered.length} turnos visibles</small></div><button className="text-button" onClick={() => onNavigate('availability')}>Vista cronológica <ArrowRight size={15} /></button></div><div className="schedule-table"><div className="schedule-head"><span>Horario</span><span>Cancha / Formato</span><span>Cliente / Reserva</span><span>Estado</span><span>Importe</span></div>{filtered.length === 0 && <div className="empty-state">No hay turnos registrados para {formatDayLabel(timezone, filterDate)} con los filtros elegidos.</div>}{filtered.slice(0, 10).map((booking) => <button className="schedule-row" key={`${booking.id ?? booking.time}-${booking.court}`} onClick={() => onSelectBooking(booking)}><span><strong>{booking.time}</strong><small>{booking.dateLabel}</small></span><span><strong>{booking.court}</strong><small>{booking.type}</small></span><span>{booking.client}</span><StatusBadge status={booking.status} /><span>{booking.price}</span><ArrowRight size={15} /></button>)}</div></section><aside className="side-stack"><section className="panel live-panel"><div className="panel-heading"><h2>Complejos y canchas</h2><span className="muted">{facilities.length} complejos</span></div><div className="availability-empty">{facilities.length === 0 ? 'Sin complejos registrados todavía.' : facilities.map((facility) => <div className="live-facility" key={facility.id}><strong>{facility.name}</strong><span>{courts.filter((court) => court.facilityId === facility.id).length} canchas ·{courts.filter((court) => court.facilityId === facility.id).map((court) => <em key={court.id}> {court.name}</em>)}</span></div>)}</div></section></aside></div></div>;
}

function StatusBadge({ status }: { status: string }) { return <span className={`status-badge ${status.toLowerCase()}`}><i />{statusLabels[status] || status}</span>; }

function AvailabilityView({ onNavigate, timezone }: { onNavigate: (view: B2bView) => void; timezone: string }) {
  const [weekStart, setWeekStart] = useState<string>(() => startOfWeekKey(timezone));
  // Si la zona carga tras el montaje, la semana se recalcula con la tz final.
  useEffect(() => {
    setWeekStart(startOfWeekKey(timezone));
  }, [timezone]);
  const [weekCourts, setWeekCourts] = useState<B2bWeeklyAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const from = dayKeyToOrgMidnight(weekStart, timezone);
    const to = addOrgDays(from, 7, timezone);
    b2bService.getWeeklyAvailability(from.toISOString(), to.toISOString())
      .then((data) => { if (active) setWeekCourts(data); })
      .catch(() => { if (active) setError('No se pudo cargar la disponibilidad semanal.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [weekStart]);
  const weekDays = Array.from({ length: 7 }, (_, day) => {
    const key = toDayKey(timezone, addOrgDays(dayKeyToOrgMidnight(weekStart, timezone), day, timezone));
    return { key, label: formatWeekdayLabel(timezone, key) };
  });
  const stateClass = (state: string) => state.toLowerCase();
  const stateLabel = (state: string) => state === 'AVAILABLE' ? 'Libre' : state === 'PENDING' ? 'Pendiente' : state === 'CONFIRMED' ? 'Reservado' : 'Bloqueado';
  const lanesFor = (courtId: string, dayKey: string) => (weekCourts.find((court) => court.courtId === courtId)?.lanes ?? []).filter((lane) => toDayKey(timezone, lane.startsAt) === dayKey);
  return <div className="b2b-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> DISPONIBILIDAD OPERATIVA</span><h1>Disponibilidad semanal</h1><p>Calendario en vivo de todos los turnos del complejo.</p></div><button className="primary-action" onClick={() => onNavigate('bookings')}>＋ Nueva reserva</button></div><div className="availability-toolbar"><button onClick={() => setWeekStart(toDayKey(timezone, addOrgDays(dayKeyToOrgMidnight(weekStart, timezone), -7, timezone)))}><ArrowLeft size={16} /></button><strong>Semana del {formatDayLabel(timezone, weekStart)}</strong><button onClick={() => setWeekStart(toDayKey(timezone, addOrgDays(dayKeyToOrgMidnight(weekStart, timezone), 7, timezone)))}><ArrowRight size={16} /></button></div>{error && <p className="settings-feedback caveat">{error}</p>}<section className="panel availability-panel"><div className="availability-legend"><span><i className="available" /> Libre</span><span><i className="confirmed" /> Reservado</span><span><i className="pending" /> Pendiente</span><span><i className="blocked" /> Bloqueado</span></div>{loading && <div className="availability-empty">Cargando disponibilidad…</div>}{!loading && weekCourts.length === 0 && <div className="availability-empty">No hay turnos generados para esta semana.</div>}{!loading && weekCourts.length > 0 && <div className="availability-grid"><div className="week-header-row"><span className="time-axis-head"></span>{weekDays.map((day) => <div className="week-head" key={day.key}>{day.label}</div>)}</div>{weekCourts.map((court) => <div className="court-lane" key={court.courtId}><div className="court-name">{court.courtName}<em>{court.sportType}</em></div>{weekDays.map((day) => <div className="day-slots" key={`${court.courtId}-${day.key}`}>{lanesFor(court.courtId, day.key).map((lane) => <div className={`slot ${stateClass(lane.state)}`} key={lane.id}><strong>{formatHourLabel(timezone, lane.startsAt)}–{formatHourLabel(timezone, lane.endsAt)}</strong><small>{stateLabel(lane.state)}{lane.clientName ? ` · ${lane.clientName}` : ''}</small></div>)}</div>)}</div>)}</div>}</section></div>;
}

function BookingsView({ bookingRows, onNavigate, onSelectBooking }: { bookingRows: BookingRow[]; onNavigate: (view: B2bView) => void; onSelectBooking: (booking: BookingRow) => void }) { return <div className="b2b-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> GESTIÓN OPERATIVA</span><h1>Bandeja de reservas</h1><p>Revisá y gestioná las solicitudes del complejo.</p></div><button className="primary-action" onClick={() => onNavigate('portal')}>＋ Nueva reserva</button></div><div className="booking-summary"><strong>{bookingRows.length} reservas visibles</strong><span>Estados sincronizados</span><div className="search-bookings">Buscar cliente o reserva...</div></div><section className="panel booking-list"><div className="booking-list-head"><span>Turno</span><span>Cliente</span><span>Cancha</span><span>Estado</span><span>Importe</span><span /></div>{bookingRows.slice(0, 10).map((booking) => <button className="booking-list-row" key={`${booking.client}-${booking.time}`} onClick={() => onSelectBooking(booking)}><span><strong>{booking.time}</strong></span><span><strong>{booking.client}</strong><small>Reserva online</small></span><span>{booking.court}<small>{booking.type}</small></span><StatusBadge status={booking.status} /><span><strong>{booking.price}</strong><small>ARS</small></span><ArrowRight size={17} /></button>)}</section></div>; }

function RealClientView({ view, onNavigate, timezone }: { view: B2bView; onNavigate: (view: B2bView) => void; timezone: string }) {
  const user = useB2bStore((state) => state.user);
  const [facilities, setFacilities] = useState<B2bPublicFacility[]>([]);
  const [facilityId, setFacilityId] = useState('');
  const [courts, setCourts] = useState<Array<{ id: string; name: string; sportType: string; defaultPriceCentsArs: number }>>([]);
  const [shifts, setShifts] = useState<Array<{ id: string; courtId: string; startsAt: string; endsAt: string; priceCentsArs: number }>>([]);
  const [message, setMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const organizationId = user?.organizationId;
    if (!organizationId) { setMessage('Tu sesión no pertenece a una organización.'); return; }
    b2bService.getPublicFacilities(organizationId)
      .then((items) => {
        setFacilities(items);
        if (items.length > 0) setFacilityId(items[0].id);
      })
      .catch(() => setMessage('No se pudieron cargar los complejos.'));
  }, [user?.organizationId]);
  useEffect(() => {
    if (!facilityId) return;
    setMessage('');
    setCourts([]);
    setShifts([]);
    const facility = facilities.find((item) => item.id === facilityId);
    const facilityCourts = facility?.courts ?? [];
    setCourts(facilityCourts);
    if (facilityCourts.length === 0) return;
    const from = startOfOrgDay(new Date(), timezone);
    const to = addOrgDays(from, 7, timezone);
    Promise.allSettled(facilityCourts.map((court) => b2bService.getAvailability(court.id, from.toISOString(), to.toISOString())))
      .then((results) => setShifts(results.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled').flatMap((result) => result.value)))
      .catch(() => setMessage('No se pudieron cargar las canchas de este complejo.'));
  }, [facilityId, reloadKey]);
    const selectedOrgName = facilities.find((item) => item.id === facilityId)?.name ?? '';
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [duration, setDuration] = useState<1 | 2>(1);
  const [selectedShift, setSelectedShift] = useState<{ courtName: string; courtId: string; shiftId?: string; startsAt: string; label: string; priceCents: number } | null>(null);
  const [lastBooking, setLastBooking] = useState<{ id: string } | null>(null);
  const finishPayment = () => {
    setSelectedDate('');
    setSelectedShift(null);
    setDuration(1);
    setLastBooking(null);
    setReloadKey((key) => key + 1);
    setMessage('Reserva registrada. El complejo confirmará tu turno.');
    onNavigate('portal');
  };
  if (view === 'payment') return <PaymentView onNavigate={onNavigate} onComplete={finishPayment} timezone={timezone} lastBooking={lastBooking} selectedShift={selectedShift} duration={duration} organizationName={selectedOrgName} />;
  if (view === 'bookings') return <ClientBookingsView timezone={timezone} onBack={() => onNavigate('portal')} />;
  if (view === 'profile') return <ProfileView role="client" onBack={() => onNavigate('portal')} />;
    const demoCourts = courts.length ? courts : [{ id: 'placeholder', name: 'Sin canchas todavía', sportType: 'Seleccioná un complejo', defaultPriceCentsArs: 0 }];
  const reserve = async (courtId: string, shiftId?: string) => {
    if (!shiftId) { setMessage('Seleccioná un turno disponible.'); return; }
    try {
      const result = await b2bService.createBooking({ courtId, shiftId });
      setLastBooking(result);
      setMessage('Turno reservado correctamente.');
      onNavigate('payment');
      return result;
    } catch (error: any) {
      const reason = error?.response?.data?.message;
      setMessage(typeof reason === 'string' && reason ? reason : 'No se pudo reservar el turno. Intentalo de nuevo.');
      return null;
    }
  };
  const weekDayKeys = Array.from({ length: 7 }, (_, i) => toDayKey(timezone, addOrgDays(new Date(), i, timezone)));
  const activeDay = selectedDate || (weekDayKeys[0] ?? '');
  const durationLabel = duration === 1 ? '1 hora' : '2 horas';
  const selectedTotalCents = selectedShift ? selectedShift.priceCents * duration : 0;
  const confirmSelection = () => {
    if (selectedShift) void reserve(selectedShift.courtId, selectedShift.shiftId);
    else setMessage('Seleccioná un turno disponible para continuar al pago.');
  };
  return <div className="b2b-content client-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> PORTAL CLIENTE</span><h1>Reservá tu cancha</h1><p>Elegí el complejo, horario y duración de tu turno.</p></div><div className="client-chip"><UserRound size={15} /> Cliente autenticado</div></div>{message && <p className="settings-feedback">{message}</p>}<div className="client-booking-layout"><section className="panel client-selector"><div className="selector-block"><label>Complejo</label><select className="b2b-input" value={facilityId} onChange={(event) => setFacilityId(event.target.value)}>{facilities.length === 0 && <option value="">Cargando complejos…</option>}{facilities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="selector-block"><label>Fecha</label><div className="flex flex-wrap gap-2">{weekDayKeys.map((key) => { const isActive = activeDay === key; return <button key={key} onClick={() => { setSelectedDate(key); setSelectedShift(null); }} className={`min-h-11 px-3 rounded-lg border text-xs font-label-md ${isActive ? 'bg-[#15803d] text-white border-[#15803d]' : 'bg-white text-slate-600 border-slate-200'}`}>{formatWeekdayLabel(timezone, key)}</button>; })}</div></div><div className="selector-block"><label>Duración</label><div className="duration-toggle"><button className={duration === 1 ? 'active' : ''} onClick={() => setDuration(1)}>1 hora</button><button className={duration === 2 ? 'active' : ''} onClick={() => setDuration(2)}>2 horas</button></div></div><h2>Turnos disponibles</h2><div className="client-court-list">{demoCourts.map((court) => { const courtShifts = shifts.filter((shift) => shift.courtId === court.id && toDayKey(timezone, shift.startsAt) === activeDay).slice(0, 4); return <div className="client-court" key={court.id}><span><strong>{court.name} · {court.sportType}</strong><small>Superficie sintética · Precio desde ${(court.defaultPriceCentsArs / 100).toLocaleString('es-AR')} ARS</small></span><div className="flex flex-wrap gap-2">{(courtShifts.length ? courtShifts : []).map((shift) => { const isSel = selectedShift?.shiftId === shift.id; const label = formatHourLabel(timezone, shift.startsAt); return <button key={`${court.id}-${shift.id || 'shift'}`} className={isSel ? 'selected' : ''} onClick={() => setSelectedShift({ courtName: court.name, courtId: court.id, shiftId: shift.id, startsAt: shift.startsAt, label, priceCents: shift.priceCentsArs })}>{label}<small>$ {(shift.priceCentsArs / 100).toLocaleString('es-AR')}</small></button>; })}</div>{courtShifts.length === 0 && <small className="text-slate-400">Sin turnos para este día.</small>}</div>; })}</div></section><aside className="panel booking-receipt"><span className="eyebrow">RESUMEN DEL TURNO</span><h2>Tu reserva</h2><div className="receipt-row"><span>Complejo</span><strong>{selectedOrgName || 'Seleccioná un complejo'}</strong></div><div className="receipt-row"><span>Cancha</span><strong>{selectedShift?.courtName || 'Elegí un turno'}</strong></div><div className="receipt-row"><span>Horario</span><strong>{selectedShift?.label || '—'}</strong></div><div className="receipt-row"><span>Duración</span><strong>{durationLabel}</strong></div><div className="receipt-total"><span>Total estimado</span><strong>$ {(selectedTotalCents / 100).toLocaleString('es-AR')} ARS</strong></div><button className="primary-action wide hidden md:inline-flex" disabled={!selectedShift} onClick={confirmSelection}><Check size={16} /> Continuar a Pago</button><small className="receipt-note">Se requiere una cuenta autenticada para reservar.</small></aside></div>{selectedShift && <div className="mobile-sticky-bar md:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-6px_20px_rgba(15,23,42,0.12)]"><div className="min-w-0"><div className="text-xs text-slate-500 truncate">{selectedShift.courtName} · {selectedShift.label} · {durationLabel}</div><div className="font-bold text-[#15803d]">$ {(selectedTotalCents / 100).toLocaleString('es-AR')} ARS</div></div><button className="shrink-0 min-h-11 px-5 rounded-lg bg-[#15803d] text-white font-bold text-sm" onClick={confirmSelection}>Continuar a Pago</button></div>}</div>;

}

function ClientBookingsView({ timezone, onBack }: { timezone: string; onBack: () => void }) {
  const [items, setItems] = useState<B2bBooking[]>([]);
  const [now, setNow] = useState(Date.now());
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = () => b2bService.getBookings().then(setItems).catch(() => setFeedback({ load: 'No se pudieron cargar tus turnos.' }));
  useEffect(() => {
    load();
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const statusLabel: Record<string, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmado', CANCELLED: 'Cancelado', COMPLETED: 'Completado' };
  const confirm = async (id: string) => {
    setBusyId(id);
    try {
      const result = await b2bService.confirmAttendance(id);
      setFeedback((current) => ({ ...current, [id]: result.message }));
      setNow(Date.now());
    } catch (error: any) {
      const reason = error?.response?.data?.message;
      setFeedback((current) => ({ ...current, [id]: typeof reason === 'string' && reason ? reason : 'No se pudo enviar la confirmación.' }));
    } finally {
      setBusyId(null);
    }
  };
  return (
    <div className="b2b-content client-content">
      <div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> MIS TURNOS</span><h1>Tus reservas</h1><p>Confirmá asistencia dentro de los 30 minutos previos a tu turno.</p></div>{feedback.load && <div className="client-chip"><X size={15} /> {feedback.load}</div>}</div>
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Volver al portal</button>
      {items.length === 0 ? <section className="panel"><div className="empty-state">Todavía no tenés turnos reservados.</div></section> : <section className="panel"><div className="client-bookings-list">{items.map((booking) => {
        const startsAtMs = new Date(booking.shiftStartsAt ?? '').getTime();
        const minutesLeft = Math.round((startsAtMs - now) / 60000);
        const isActive = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
        const canConfirm = isActive && minutesLeft >= 0 && minutesLeft <= 30;
        return (
          <div className="client-booking-row" key={booking.id}>
            <div><strong>{booking.courtName ?? 'Cancha'} {booking.courtSportType ? `· ${booking.courtSportType}` : ''}</strong><small>{statusLabel[booking.status] ?? booking.status}</small></div>
            <span className="client-booking-when">{booking.shiftStartsAt ? `${formatDayLabel(timezone, booking.shiftStartsAt)} · ${formatHourLabel(timezone, booking.shiftStartsAt)}` : '—'}</span>
            <span className="client-booking-price">$ {(booking.priceCentsArs / 100).toLocaleString('es-AR')} ARS</span>
            <div className="client-booking-action">
              {canConfirm ? (
                <button className="primary-action" disabled={busyId === booking.id} onClick={() => confirm(booking.id)}>{busyId === booking.id ? 'Enviando…' : 'Confirmo asistencia'}</button>
              ) : isActive ? (
                <small className="text-slate-400">{minutesLeft < 0 ? 'El turno ya comenzó.' : `El botón se habilita a 30 min del turno (faltan ${minutesLeft} min).`}</small>
              ) : null}
              {feedback[booking.id] && <small className="settings-feedback">{feedback[booking.id]}</small>}
            </div>
          </div>
        );
      })}</div></section>}
    </div>
  );
}

function ScheduleView() {
  const [courts, setCourts] = useState<Array<{ id: string; name: string }>>([]);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    b2bService.getCourts().then((items) => setCourts(items)).catch(() => setFeedback('No se pudieron cargar las canchas.'));
  }, []);
  return <div className="b2b-content"><div className="b2b-page-heading compact"><div><span className="eyebrow"><i /> HORARIOS</span><h1>Horarios y configuración</h1><p>Reglas de disponibilidad por cancha, generación de turnos y bloqueos.</p></div></div>{feedback && <p className="settings-feedback caveat">{feedback}</p>}<ScheduleSettings courts={courts} /></div>;
}

function SettingsView() {
  const [tab, setTab] = useState<'facilities' | 'courts' | 'rules'>('facilities');
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; address?: string | null; status: string }>>([]);
  const [courts, setCourts] = useState<Array<{ id: string; facilityId: string; name: string; sportType: string; capacity: number; defaultPriceCentsArs: number }>>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [facilityNameDraft, setFacilityNameDraft] = useState('');
  const [facilityAddressDraft, setFacilityAddressDraft] = useState('');
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
      if (!courtFacilityId && loadedFacilities.length) setCourtFacilityId(loadedFacilities[0].id);
    })    .catch(() => setFeedback('No se pudieron cargar los datos. Intentalo de nuevo.'));
  }, []);
  const addFacility = async () => {
    if (!name.trim()) return;
    try {
      const facility = await b2bService.createFacility({ name: name.trim(), address: address.trim() || undefined });
      setFacilities((current) => [...current, facility]);
      setCourtFacilityId(facility.id);
      setName('');
      setAddress('');
      setTab('courts');
      setCourtName('Nueva cancha de ' + facility.name);
      setShowCourtForm(true);
      setFeedback(`Complejo "${facility.name}" creado. Ahora agregá la cancha, ya está preseleccionado su complejo.`);
    } catch { setFeedback('No se pudo crear el complejo.'); }
  };
  const saveFacilityEdits = async (id: string) => {
    if (!facilityNameDraft.trim()) { setFeedback('El nombre del complejo no puede quedar vacío.'); return; }
    try {
      const updated = await b2bService.updateFacility(id, { name: facilityNameDraft.trim(), address: facilityAddressDraft.trim() || undefined });
      setFacilities((current) => current.map((item) => item.id === id ? { ...item, name: updated.name, address: updated.address ?? null } : item));
      setEditingFacilityId(null);
      setFeedback('Complejo actualizado correctamente.');
    } catch { setFeedback('No se pudo actualizar el complejo.'); }
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
          </div>
          <div className="facility-form">
            <input className="b2b-input" placeholder="Nombre del complejo" value={name} onChange={(event) => setName(event.target.value)} />
            <input className="b2b-input" placeholder="Dirección (ej. Av. Siempreviva 123)" value={address} onChange={(event) => setAddress(event.target.value)} />
            <button className="primary-action" disabled={!name.trim()} onClick={addFacility}>＋ Agregar</button>
          </div>
          <div className="settings-list">
            {facilities.map((facility) => {
              if (editingFacilityId === facility.id) {
                return (
                  <div className="settings-row editing-facility" key={facility.id}>
                    <span className="settings-icon"><Trophy size={16} /></span>
                    <span className="facility-edit-fields">
                      <input className="b2b-input" value={facilityNameDraft} onChange={(event) => setFacilityNameDraft(event.target.value)} aria-label="Nombre del complejo" />
                      <input className="b2b-input" value={facilityAddressDraft} onChange={(event) => setFacilityAddressDraft(event.target.value)} aria-label="Dirección del complejo" placeholder="Dirección" />
                    </span>
                    <span className="facility-edit-actions">
                      <button className="secondary-action" onClick={() => setEditingFacilityId(null)}>Cancelar</button>
                      <button className="primary-action" onClick={() => saveFacilityEdits(facility.id)}>Guardar</button>
                    </span>
                  </div>
                );
              }
              return (
              <div className="settings-row" key={facility.id}>
                <span className="settings-icon"><Trophy size={16} /></span>
                <span><strong>{facility.name}</strong><small>{facility.address || 'Sin dirección configurada'}</small></span>
                <StatusBadge status={facility.status === 'ACTIVE' ? 'CONFIRMED' : 'CANCELLED'} />
                <button className="icon-button" title="Editar complejo" onClick={() => { setEditingFacilityId(facility.id); setFacilityNameDraft(facility.name); setFacilityAddressDraft(facility.address ?? ''); }}>⋮</button>
              </div>
              );
            })}
          </div>
          {!facilities.length && <p className="settings-feedback caveat">Todavía no hay complejos. Creá uno para empezar a cargar canchas y horarios.</p>}
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


function PaymentView({ onNavigate, onComplete, timezone, lastBooking, selectedShift, duration, organizationName }: {
  onNavigate: (view: B2bView) => void;
  onComplete: () => void;
  timezone: string;
  lastBooking: { id: string } | null;
  selectedShift: { courtName: string; startsAt: string; label: string; priceCents: number } | null;
  duration: 1 | 2;
  organizationName: string;
}) {
  const [modality, setModality] = useState<'deposit' | 'total'>('deposit');
  const [method, setMethod] = useState<'mercadopago' | 'transfer'>('mercadopago');
  const [holder, setHolder] = useState('');
  const [orgPhone, setOrgPhone] = useState<string | null>(null);
  useEffect(() => {
    b2bService.getOrganization()
      .then((org) => setOrgPhone(typeof org?.whatsappPhone === 'string' && org.whatsappPhone ? org.whatsappPhone : null))
      .catch(() => setOrgPhone(null));
  }, []);
  const label = modality === 'deposit' ? 'Pagar seña (30%)' : 'Pagar total';
  const amountCents = selectedShift ? selectedShift.priceCents * duration : 0;
  const dayLabel = selectedShift ? formatDayLabel(timezone, selectedShift.startsAt) : '';
  const hourLabel = selectedShift ? formatHourLabel(timezone, selectedShift.startsAt) : '';
  const canSendComprobante = Boolean(orgPhone && selectedShift && lastBooking);
  const comprobanteText = [
    `Hola ${organizationName || 'Complejo'}! Te envío el comprobante de mi reserva.`,
    `Reserva: ${lastBooking?.id ?? '-'}`,
    `Cancha: ${selectedShift?.courtName ?? '-'}`,
    `Día: ${dayLabel} · ${hourLabel} · ${duration} hora${duration === 1 ? '' : 's'}`,
    `Importe: $ ${(amountCents / 100).toLocaleString('es-AR')} ARS (${modality === 'deposit' ? 'seña' : 'total'})`,
    holder ? `Titular: ${holder}` : '',
  ].filter(Boolean).join('\n');
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
          <div className="payment-detail"><span>Resumen de reserva</span>{selectedShift && lastBooking ? <strong>{selectedShift.courtName} · {dayLabel}</strong> : <strong>Reserva confirmada</strong>}<small>{selectedShift && lastBooking ? `${hourLabel} · ${duration} hora${duration === 1 ? '' : 's'} · $ ${(amountCents / 100).toLocaleString('es-AR')} ARS · Ref ${lastBooking.id}` : 'Los datos del turno se cargarán desde tu historial de reservas.'}</small></div>
          <div className="selector-block"><label>Modalidad de pago</label><div className="duration-toggle"><button className={modality === 'deposit' ? 'active' : ''} onClick={() => setModality('deposit')}>Seña (30%)</button><button className={modality === 'total' ? 'active' : ''} onClick={() => setModality('total')}>Pago total</button></div></div>
          <div className="selector-block"><label>Medio de pago</label><div className="duration-toggle"><button className={method === 'mercadopago' ? 'active' : ''} onClick={() => setMethod('mercadopago')}>Mercado Pago</button><button className={method === 'transfer' ? 'active' : ''} onClick={() => setMethod('transfer')}>Transferencia</button></div></div>
          <div className="selector-block"><label>Nombre del titular</label><input className="b2b-input" placeholder="Como figura en la tarjeta" value={holder} onChange={(event) => setHolder(event.target.value)} /></div>
          <div className="receipt-total"><span>Total</span><strong>{label}</strong></div>
          <button className="primary-action wide hidden md:inline-flex" onClick={onComplete}><Check size={16} /> {label}</button>
          {canSendComprobante && (
            <div className="wa-optin-row wa-optin-action">
              <a className="primary-action wide" href={buildWhatsAppDeepLink(orgPhone as string, comprobanteText)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Enviar comprobante por WhatsApp</a>
              <small>Se abre tu WhatsApp con el comprobante armado para mandárselo al dueño.</small>
            </div>
          )}
          <p className="payment-note">Pago SIMULADO: la integración con una pasarela de pagos se agregará en una etapa posterior.</p>
        </section>
      </div>
      <div className="mobile-sticky-bar md:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-6px_20px_rgba(15,23,42,0.12)]"><div className="min-w-0"><div className="text-xs text-slate-500">Modalidad</div><div className="font-bold text-[#15803d]">{label}</div></div><button className="shrink-0 min-h-11 px-5 rounded-lg bg-[#15803d] text-white font-bold text-sm" onClick={onComplete}>{label}</button></div>
    </div>
  );
}
function BookingDrawer({ booking, timezone, onClose, onAction }: { booking: BookingRow; timezone: string; onClose: () => void; onAction: (action: 'confirm' | 'cancel') => Promise<void> }) { return <div className="drawer-backdrop" onClick={onClose}><aside className="booking-drawer" onClick={(event) => event.stopPropagation()}><button className="close-drawer" onClick={onClose}><X size={18} /></button><span className="eyebrow">DETALLE DE RESERVA</span><h2>{booking.client}</h2><StatusBadge status={booking.status} /><div className="drawer-details"><span><Clock3 size={16} />{booking.time}</span><span><CalendarDays size={16} /> {formatDayLabel(timezone, booking.dateKey)}</span><span><Trophy size={16} />{booking.court} · {booking.type}</span><span><CircleDollarSign size={16} />{booking.price} ARS</span></div><div className="drawer-actions"><button className="secondary-action" onClick={() => onAction('cancel')}>Cancelar</button><button className="primary-action" onClick={() => onAction('confirm')}>Confirmar reserva</button></div></aside></div>; }