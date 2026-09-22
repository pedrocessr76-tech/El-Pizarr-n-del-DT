import axios from 'axios';

export interface B2bUser {
  userId: string;
  organizationId: string;
  email: string;
  roles: string[];
}

export interface B2bAuthResponse {
  accessToken: string;
  user: B2bUser;
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
export interface B2bShiftRule { id: string; courtId: string; weekday: number; startTime: string; endTime: string; durationHours: number; priceCentsArs: number; active: boolean; }
export interface B2bShift { id: string; courtId: string; startsAt: string; endsAt: string; priceCentsArs: number; status: string; }

// El backend sirve el B2B bajo `/api/v1`. VITE_API_URL apunta a la raíz de la API
// (misma convención que en api.ts), por eso se agrega el prefijo `/api`.
// En dev, Vite proxya `/api` al backend, así que la base queda `/api` de forma consistente.
const B2B_API_BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')}/api`;

export const b2bApi = axios.create({
  baseURL: B2B_API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

b2bApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('b2bToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const b2bService = {
  async login(email: string, password: string) {
    const { data } = await b2bApi.post<B2bAuthResponse>('/v1/auth/login', { email, password });
    return data;
  },
  async registerClient(input: { email: string; fullName: string; password: string }) {
    const { data } = await b2bApi.post<B2bAuthResponse>('/v1/auth/register-client', input);
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
  async getProfile() {
    const { data } = await b2bApi.get<B2bUser>('/v1/auth/me');
    return data;
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
};