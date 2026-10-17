const LEGACY_TOKEN_KEY = "hirepilot.auth.accessToken";
export const LOGGED_OUT_KEY = "hirepilot.auth.loggedOut";
export const AUTH_EVENT_KEY = "hirepilot.auth.event";

function storage(name) {
  try {
    return typeof window === "undefined" ? null : window[name];
  } catch {
    return null;
  }
}

// Access tokens live in memory. The HttpOnly refresh cookie restores sessions.
export function clearAuthStorage() {
  for (const name of ["localStorage", "sessionStorage"]) {
    try {
      storage(name)?.removeItem(LEGACY_TOKEN_KEY);
    } catch {
      /* Storage may be blocked. */
    }
  }
}
export function hasLoggedOutMarker() {
  try {
    return (
      storage("localStorage")?.getItem(LOGGED_OUT_KEY) === "1" ||
      storage("sessionStorage")?.getItem(LOGGED_OUT_KEY) === "1"
    );
  } catch {
    return false;
  }
}
export function setLoggedOutMarker() {
  try {
    storage("localStorage")?.setItem(LOGGED_OUT_KEY, "1");
  } catch {
    /* In-memory logout still works. */
  }
}
export function clearLoggedOutMarker() {
  for (const name of ["localStorage", "sessionStorage"]) {
    try {
      storage(name)?.removeItem(LOGGED_OUT_KEY);
    } catch {
      /* Storage may be blocked. */
    }
  }
}
export function broadcastAuthEvent(type) {
  try {
    storage("localStorage")?.setItem(
      AUTH_EVENT_KEY,
      JSON.stringify({ type, id: crypto.randomUUID() }),
    );
  } catch {
    /* Cross-tab sync is best effort. */
  }
}
