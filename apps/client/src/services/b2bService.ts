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
}

export interface B2bFacility { id: string; organizationId: string; name: string; address?: string | null; status: string; }
export interface B2bCourt { id: string; facilityId: string; organizationId: string; name: string; sportType: string; capacity: number; status: string; defaultPriceCentsArs: number; }
export interface B2bMetricsSummary { date: string; currency: string; totalShifts: number; occupiedShifts: number; availableShifts: number; pendingBookings: number; confirmedBookings: number; cancelledBookings: number; revenueCentsArs: number; }

export const b2bApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
  async register(input: { organizationName: string; slug: string; email: string; fullName: string; password: string }) {
    const { data } = await b2bApi.post<B2bAuthResponse>('/v1/auth/register', input);
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
  async getBookings() {
    const { data } = await b2bApi.get<B2bBooking[]>('/v1/bookings');
    return data;
  },
  async getMetricsSummary(date?: string) {
    const { data } = await b2bApi.get<B2bMetricsSummary>('/v1/metrics/summary', { params: date ? { date } : undefined });
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
};