import axios, { type InternalAxiosRequestConfig } from 'axios';

export interface B2bUser {
  userId: string;
  organizationId: string;
  email: string;
  /** Verificación obligatoria del email: el login se frena mientras sea false. */
  emailVerified?: boolean;
  roles: string[];
  whatsappPhone?: string | null;
  whatsappOptIn?: boolean;
}

export interface B2bAuthResponse {
  accessToken: string;
  user: B2bUser;
}

/**
 * Respuesta del registro y del onboarding. Ya NO trae sesión: la cuenta nace
 * sin verificar, así que el servidor devuelve qué hacer a continuación en vez
 * de un token.
 */
export interface B2bPendingVerification {
  email: string;
  emailVerified: false;
  message: string;
}

export interface B2bBooking {
  id: string;
  courtId: string;
  shiftId: string;
  clientUserId: string;
  status: string;
  priceCentsArs: number;
  notes?: string | null;
  shiftStartsAt?: string | null;
  shiftEndsAt?: string | null;
  courtName?: string | null;
  courtSportType?: string | null;
  clientName?: string | null;
}

export interface B2bWeeklyAvailability {
  courtId: string;
  courtName: string;
  sportType: string;
  facilityId: string;
  lanes: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    priceCentsArs: number;
    state: 'AVAILABLE' | 'CONFIRMED' | 'PENDING' | 'BLOCKED';
    clientName?: string | null;
  }>;
}

export interface B2bFacility { id: string; organizationId: string; name: string; address?: string | null; status: string; }
export interface B2bCourt { id: string; facilityId: string; organizationId: string; name: string; sportType: string; capacity: number; status: string; defaultPriceCentsArs: number; }
export interface B2bMetricsSummary { date: string; currency: string; totalShifts: number; occupiedShifts: number; availableShifts: number; pendingBookings: number; confirmedBookings: number; cancelledBookings: number; revenueCentsArs: number; }
export interface B2bOrganizationOption { id: string; name: string; slug: string; }
export interface B2bPublicFacility { id: string; name: string; address?: string | null; courts: Array<{ id: string; name: string; sportType: string; capacity: number; defaultPriceCentsArs: number }>; }
export interface B2bShiftRule { id: string; courtId: string; weekday: number; startTime: string; endTime: string; durationHours: number; priceCentsArs: number; active: boolean; }
export interface B2bShift { id: string; courtId: string; startsAt: string; endsAt: string; priceCentsArs: number; status: string; }
export interface B2bOrganizationSettings { id: string; name: string; slug: string; timezone: string | null; whatsappPhone?: string | null; whatsappOptIn?: boolean; whatsappReminderIntervalsMinutes?: number[]; emailReminderIntervalsMinutes?: number[]; }

/** Aviso de WhatsApp que el processor dejó esperando despacho manual (#34). */
export interface B2bPendingWhatsAppAlert {
  reminderId: string;
  bookingId: string;
  clientName: string;
  phone: string;
  courtName: string;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  minutesBefore: number;
  body: string;
}

export type B2bPivotRole = 'GOALKEEPER' | 'FIELD' | 'BOTH';
export interface B2bPivotProfile { userId: string; fullName: string; email: string; available: boolean; role: B2bPivotRole; positions: string[]; whatsappPhone?: string | null; whatsappOptIn?: boolean; }
export interface B2bPivotPlayer { userId: string; fullName: string; email: string; role: B2bPivotRole; positions: string[]; whatsappPhone: string | null; whatsappOptIn: boolean; organizationId: string; }

// El access token B2B vive sólo EN MEMORIA (issue #17): la sesión larga la
// renueva el refresh token que la API guarda en cookie HttpOnly.
let b2bAccessToken: string | null = null;

export function setB2bAccessToken(token: string | null): void {
  b2bAccessToken = token;
}

export function getB2bAccessToken(): string | null {
  return b2bAccessToken;
}

function clearB2bSession(): void {
  b2bAccessToken = null;
}

// El backend sirve el B2B bajo `/api/v1`. VITE_API_URL apunta a la raíz de la API
// (misma convención que en api.ts), por eso se agrega el prefijo `/api`.
// En dev, Vite proxya `/api` al backend, así que la base queda `/api` de forma consistente.
const B2B_API_BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')}/api`;

export const b2bApi = axios.create({
  baseURL: B2B_API_BASE,
  // withCredentials permite que la cookie HttpOnly del refresh viaje en
  // POST /v1/auth/refresh y /v1/auth/logout.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

b2bApi.interceptors.request.use((config) => {
  const token = getB2bAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Renovación con coalescing para los 401 del B2B.
let b2bRefreshing: Promise<string | null> | null = null;

/** Refresh/logout se autentican con cookie: un 401 ahí NO debe reentrar al interceptor. */
function isB2bCookieAuthRequest(config?: { url?: string }): boolean {
  return /\/auth\/(refresh|logout)(?:\?|$)/.test(config?.url ?? '');
}

function requestB2bRefresh(): Promise<string | null> {
  if (!b2bRefreshing) {
    b2bRefreshing = b2bApi
      .post<B2bAuthResponse>('/v1/auth/refresh')
      .then(({ data }) => {
        setB2bAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        clearB2bSession();
        return null;
      })
      .finally(() => {
        b2bRefreshing = null;
      });
  }
  return b2bRefreshing;
}

b2bApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isB2bCookieAuthRequest(original)
    ) {
      original._retried = true;
      return requestB2bRefresh().then((token) => {
        if (!token) return Promise.reject(error);
        original.headers.Authorization = `Bearer ${token}`;
        return b2bApi(original);
      });
    }
    return Promise.reject(error);
  }
);

export const b2bService = {
  async login(email: string, password: string) {
    const { data } = await b2bApi.post<B2bAuthResponse>('/v1/auth/login', { email, password });
    return data;
  },
  /**
   * Canjea el token del enlace por una cuenta verificada. Devuelve 200 con
   * `verified: true` o 400 con el motivo (vencido, usado, inválido) para que la
   * pantalla ofrezca reenviar sin inventar nada.
   */
  async verifyEmail(token: string) {
    const { data } = await b2bApi.post<{ verified: boolean; message: string }>('/v1/auth/verify-email', { token });
    return data;
  },
  /**
   * Pide un enlace nuevo. La respuesta es genérica a propósito: el servidor
   * responde igual exista o no la cuenta, y el cliente no puede (ni debe)
   * deducir de la respuesta si el email estaba registrado.
   */
  async resendVerification(email: string) {
    const { data } = await b2bApi.post<{ message: string }>('/v1/auth/resend-verification', { email });
    return data;
  },
  async registerClient(input: { email: string; fullName: string; password: string }) {
    const { data } = await b2bApi.post<B2bPendingVerification>('/v1/auth/register-client', input);
    return data;
  },
  async onboardOwner(input: { organizationName: string; facilityName?: string; ownerFullName: string; email: string; password: string }) {
    const { data } = await b2bApi.post<B2bPendingVerification>('/v1/auth/onboarding', input);
    return data;
  },
  async getPublicOrganizations() {
    const { data } = await b2bApi.get<B2bOrganizationOption[]>('/v1/auth/organizations');
    return data;
  },
  async getPublicCourts(organizationId: string) {
    const { data } = await b2bApi.get(`/v1/auth/organizations/${organizationId}/courts`);
    return data;
  },
  async getPublicFacilities(organizationId: string) {
    const { data } = await b2bApi.get<B2bPublicFacility[]>(`/v1/auth/organizations/${organizationId}/facilities`);
    return data;
  },
  async getProfile() {
    const { data } = await b2bApi.get<B2bUser>('/v1/auth/me');
    return data;
  },
  async updateProfile(input: { whatsappPhone?: string; whatsappOptIn?: boolean }) {
    const { data } = await b2bApi.patch<B2bUser>('/v1/auth/profile', input);
    return data;
  },
  async updateOrganizationContact(input: { whatsappPhone?: string; whatsappOptIn?: boolean }) {
    const { data } = await b2bApi.patch<{ whatsappPhone: string | null; whatsappOptIn: boolean }>('/v1/auth/organization', input);
    return data;
  },
  async getOrganization() {
    const { data } = await b2bApi.get<B2bOrganizationSettings>('/v1/organizations/me');
    return data;
  },
  /**
   * Guarda las anticipaciones de cada canal por separado (#34). El email lo
   * manda el servidor solo; el de WhatsApp genera un aviso que despacha el
   * personal. Enviar solo los campos provistos deja el otro canal intacto.
   */
  async updateOrganizationReminderIntervals(input: {
    whatsappReminderIntervalsMinutes?: number[];
    emailReminderIntervalsMinutes?: number[];
  }) {
    const { data } = await b2bApi.patch<B2bOrganizationSettings>('/v1/organizations/me', input);
    return data;
  },
  async getPendingWhatsAppAlerts() {
    const { data } = await b2bApi.get<B2bPendingWhatsAppAlert[]>('/v1/reminders/pending');
    return data;
  },
  async markWhatsAppAlertDispatched(reminderId: string) {
    const { data } = await b2bApi.post<{ dispatched: boolean }>(
      `/v1/reminders/${encodeURIComponent(reminderId)}/sent`,
    );
    return data;
  },
  async refresh(): Promise<B2bAuthResponse | null> {
    try {
      const { data } = await b2bApi.post<B2bAuthResponse>('/v1/auth/refresh');
      setB2bAccessToken(data.accessToken);
      return data;
    } catch {
      return null;
    }
  },
  async logout(): Promise<void> {
    await b2bApi.post('/v1/auth/logout').catch(() => {});
    clearB2bSession();
  },
  async getAvailability(courtId: string, from: string, to: string) {
    const { data } = await b2bApi.get('/v1/availability', { params: { courtId, from, to } });
    return data;
  },
  async getFacilities() {
    const { data } = await b2bApi.get<B2bFacility[]>('/v1/facilities');
    return data;
  },
  async getCourts() {
    const { data } = await b2bApi.get<B2bCourt[]>('/v1/courts');
    return data;
  },
  async createFacility(input: { name: string; address?: string }) {
    const { data } = await b2bApi.post<B2bFacility>('/v1/facilities', input);
    return data;
  },
  async updateFacility(id: string, patch: { name?: string; address?: string }) {
    const { data } = await b2bApi.patch<B2bFacility>(`/v1/facilities/${id}`, patch);
    return data;
  },
  async createCourt(facilityId: string, input: { name: string; sportType?: string; defaultPriceCentsArs: number }) {
    const { data } = await b2bApi.post<B2bCourt>(`/v1/facilities/${facilityId}/courts`, input);
    return data;
  },
  async updateCourt(id: string, patch: { defaultPriceCentsArs?: number; name?: string; sportType?: string }) {
    const { data } = await b2bApi.patch<B2bCourt>(`/v1/courts/${id}`, patch);
    return data;
  },
  async getBookings() {
    const { data } = await b2bApi.get<B2bBooking[]>('/v1/bookings');
    return data;
  },
  async getMetricsSummary(date?: string, courtId?: string) {
    const { data } = await b2bApi.get<B2bMetricsSummary>('/v1/metrics/summary', { params: { ...(date ? { date } : {}), ...(courtId ? { courtId } : {}) } });
    return data;
  },
  async getWeeklyAvailability(from: string, to: string) {
    const { data } = await b2bApi.get<B2bWeeklyAvailability[]>('/v1/availability/week', { params: { from, to } });
    return data;
  },
  async createBooking(input: { courtId: string; shiftId: string; notes?: string }) {
    const { data } = await b2bApi.post<B2bBooking>('/v1/bookings', input);
    return data;
  },
  async confirmBooking(id: string) {
    const { data } = await b2bApi.post<B2bBooking>(`/v1/bookings/${id}/confirm`);
    return data;
  },
  async cancelBooking(id: string) {
    const { data } = await b2bApi.post<B2bBooking>(`/v1/bookings/${id}/cancel`);
    return data;
  },
  async confirmAttendance(id: string) {
    const { data } = await b2bApi.post<{ sent: boolean; message: string }>(`/v1/bookings/${id}/confirm-attendance`);
    return data;
  },
  async rescheduleBooking(id: string, shiftId: string) {
    const { data } = await b2bApi.post<B2bBooking>(`/v1/bookings/${id}/reschedule`, { shiftId });
    return data;
  },
  async completeBooking(id: string) {
    const { data } = await b2bApi.post<B2bBooking>(`/v1/bookings/${id}/complete`);
    return data;
  },
  async getShiftRules(courtId: string) {
    const { data } = await b2bApi.get<B2bShiftRule[]>(`/v1/courts/${courtId}/shift-rules`);
    return data;
  },
  async createShiftRule(courtId: string, input: { weekday: number; startTime: string; endTime: string; durationHours: 1 | 2; priceCentsArs: number }) {
    const { data } = await b2bApi.post<B2bShiftRule>(`/v1/courts/${courtId}/shift-rules`, input);
    return data;
  },
  async createAvailabilityBlock(courtId: string, input: { startsAt: string; endsAt: string; reason: string }) {
    const { data } = await b2bApi.post(`/v1/courts/${courtId}/availability-blocks`, input);
    return data;
  },
  async generateShifts(courtId: string, from: string, to: string) {
    const { data } = await b2bApi.post(`/v1/courts/${courtId}/shifts/generate`, { from, to });
    return data;
  },
  // Jugador pivote: el perfil y el directorio de reemplazos son del Sistema
  // Canchas, así que viajan por el mismo cliente y la misma sesión B2B.
  async getMyPivotProfile() {
    const { data } = await b2bApi.get<B2bPivotProfile>('/v1/pivots/me');
    return data;
  },
  async updateMyPivotProfile(input: { available?: boolean; role?: B2bPivotRole; positions?: string[] }) {
    const { data } = await b2bApi.patch<B2bPivotProfile>('/v1/pivots/me', input);
    return data;
  },
  async getAvailablePivots(position?: string, organizationId?: string) {
    const { data } = await b2bApi.get<B2bPivotPlayer[]>('/v1/pivots', {
      params: { ...(position ? { position } : {}), ...(organizationId ? { organizationId } : {}) },
    });
    return data;
  },
  async contactPivot(userId: string, message?: string) {
    const { data } = await b2bApi.post<{ sent: boolean; whatsappPhone: string | null }>(
      `/v1/pivots/${encodeURIComponent(userId)}/contact`,
      { message },
    );
    return data;
  },
};

/**
 * Deep link a WhatsApp (#34 R1): abre el chat del número indicado (E.164, ej.
 * +5491112345678) con un mensaje pre-cargado. No requiere proveedor de envío:
 * el teléfono del usuario final es quien manda el mensaje.
 */
export function buildWhatsAppDeepLink(phone: string, text: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
