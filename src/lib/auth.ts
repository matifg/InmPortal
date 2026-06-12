const IDLE_MS = 15 * 60 * 1000;

export function clearSession() {
  localStorage.clear();
}

export function getJwtExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isSessionExpired(token: string): boolean {
  const exp = getJwtExpiryMs(token);
  if (exp && Date.now() >= exp) return true;
  return false;
}

export function getIdleTimeoutMs() {
  return IDLE_MS;
}
