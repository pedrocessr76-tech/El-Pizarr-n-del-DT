import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearSessionTokens, getAuthToken, setUserToken } from '../utils/session';

type AuthRefreshResponse = { accessToken: string; user: { id: string; username: string } };

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  // withCredentials permite que la cookie HttpOnly del refresh token viaje en
  // POST /auth/refresh y /auth/logout (issue #17).
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Renovación con coalescing: peticiones simultáneas que reciben 401 comparten
// una sola llamada a /auth/refresh.
let refreshing: Promise<string | null> | null = null;

/** Refresh/logout se autentican con cookie: un 401 ahí NO debe reentrar al interceptor. */
function isCookieAuthRequest(config?: { url?: string }): boolean {
  return /\/auth\/(refresh|logout)(?:\?|$)/.test(config?.url ?? '');
}

function requestRefresh(): Promise<string | null> {
  if (!refreshing) {
    refreshing = api
      .post<AuthRefreshResponse>('/auth/refresh')
      .then(({ data }) => {
        setUserToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        clearSessionTokens();
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isCookieAuthRequest(original)
    ) {
      original._retried = true;
      return requestRefresh().then((token) => {
        if (!token) {
          window.dispatchEvent(new CustomEvent('epdt:session-expired'));
          return Promise.reject(error);
        }
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('epdt:session-expired'));
    }
    return Promise.reject(error);
  }
);