const GUEST_SESSION_KEY = 'epdt_guest_session';
const GUEST_TEAM_KEY = 'epdt_guest_team';

/**
 * Obtiene o crea un sessionId único para la sesión de invitado (se pierde al cerrar la pestaña).
 */
export function getOrCreateGuestSessionId(): string {
  let id = sessionStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

export function getGuestSessionId(): string | null {
  return sessionStorage.getItem(GUEST_SESSION_KEY);
}

export function setGuestTeamId(teamId: string | null) {
  if (teamId) {
    sessionStorage.setItem(GUEST_TEAM_KEY, teamId);
  } else {
    sessionStorage.removeItem(GUEST_TEAM_KEY);
  }
}

export function getGuestTeamId(): string | null {
  return sessionStorage.getItem(GUEST_TEAM_KEY);
}

export function clearGuestSession() {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
  sessionStorage.removeItem(GUEST_TEAM_KEY);
}