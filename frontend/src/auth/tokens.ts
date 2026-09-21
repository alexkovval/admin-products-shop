// Tokens live in localStorage so a page reload keeps you signed in.
// Trade-off: any XSS could read them; httpOnly cookies would be safer but need CSRF handling.
const ACCESS_KEY = "auth.access";
const REFRESH_KEY = "auth.refresh";

const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the session then just lasts until reload.
  }
}

export const getAccessToken = () => read(ACCESS_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);

function notify() {
  listeners.forEach((listener) => listener());
}

export function setTokens(access: string, refresh?: string) {
  write(ACCESS_KEY, access);
  if (refresh) write(REFRESH_KEY, refresh);
  notify();
}

export function clearTokens() {
  write(ACCESS_KEY, null);
  write(REFRESH_KEY, null);
  notify();
}

export function subscribeToTokens(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A session is valid as long as we hold a refresh token; the client swaps access tokens itself.
export const hasSession = () => !!getRefreshToken();
