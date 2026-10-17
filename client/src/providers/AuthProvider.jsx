import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import authApi from "../api/auth.api";
import {
  setAccessToken,
  onAuthFailure,
  onTokenRefreshed,
  refreshSession,
  resetSession,
  getSessionGeneration,
  withSessionLock,
} from "../api/axios";
import { getDashboardPath, ROLES } from "../types/roles";
import {
  hasLoggedOutMarker,
  setLoggedOutMarker,
  clearLoggedOutMarker,
  broadcastAuthEvent,
  AUTH_EVENT_KEY,
  LOGGED_OUT_KEY,
} from "../services/storage.service";
import { queryClient } from "../services/queryClient";

const validUser = (user) =>
  user?.id && Object.values(ROLES).includes(user.role);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const mounted = useRef(false);
  const operation = useRef(0);
  const logoutPromise = useRef(null);

  const clearAuth = useCallback(() => {
    operation.current += 1;
    resetSession();
    queryClient.clear();
    setToken(null);
    setUser(null);
    setSessionError("");
    setIsLoading(false);
  }, []);

  const restoreSession = useCallback(async () => {
    const attempt = ++operation.current;
    if (hasLoggedOutMarker()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setSessionError("");
    try {
      const data = await refreshSession();
      const currentUser = data.user ?? (await authApi.getCurrentUser());
      if (!mounted.current || attempt !== operation.current) return;
      if (!validUser(currentUser))
        throw new Error("Your account could not be loaded. Please try again.");
      setToken(data.accessToken);
      setUser(currentUser);
    } catch (error) {
      if (!mounted.current || attempt !== operation.current) return;
      if ([401, 403].includes(error?.status ?? error?.response?.status)) {
        clearAuth();
      } else if (error?.code !== "ERR_CANCELED") {
        setSessionError(
          "We couldn't reconnect to your account. Check your connection and try again.",
        );
      }
    } finally {
      if (mounted.current && attempt === operation.current) setIsLoading(false);
    }
  }, [clearAuth]);

  const login = useCallback(async (credentials) => {
    const attempt = ++operation.current;
    resetSession();
    const data = await withSessionLock(() => authApi.login(credentials));
    if (attempt !== operation.current)
      throw new Error("Your session changed. Please sign in again.");
    if (!data?.accessToken || !validUser(data.user))
      throw new Error("Sign-in could not be completed. Please try again.");
    queryClient.clear();
    setAccessToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    setSessionError("");
    setSessionNotice("");
    setIsLoading(false);
    clearLoggedOutMarker();
    broadcastAuthEvent("login");
    return data;
  }, []);

  // Registration creates an account, not an authenticated session.
  const register = useCallback((data) => authApi.register(data), []);

  const logout = useCallback(() => {
    if (logoutPromise.current) return logoutPromise.current;
    setLoggedOutMarker();
    clearAuth();
    setSessionNotice("You've been signed out.");
    broadcastAuthEvent("logout");
    const promise = withSessionLock(() => authApi.logout()).catch(() => {
      setSessionNotice(
        "You're signed out on this device. The server couldn't be reached to close the remote session.",
      );
    });
    logoutPromise.current = promise;
    promise.finally(() => {
      logoutPromise.current = null;
    });
    return promise;
  }, [clearAuth]);

  const getCurrentUser = useCallback(async () => {
    const generation = getSessionGeneration();
    const currentUser = await authApi.getCurrentUser();
    if (generation === getSessionGeneration() && validUser(currentUser))
      setUser(currentUser);
    return currentUser;
  }, []);

  const changePassword = useCallback(
    async (data) => {
      const result = await authApi.changePassword(data);
      setLoggedOutMarker();
      clearAuth();
      setSessionNotice("Password updated. Please sign in again.");
      broadcastAuthEvent("logout");
      return result;
    },
    [clearAuth],
  );

  useEffect(() => {
    mounted.current = true;
    const unsubscribeFailure = onAuthFailure(() => {
      clearAuth();
      setSessionNotice("Your session has expired. Please sign in again.");
      broadcastAuthEvent("logout");
    });
    const unsubscribeRefresh = onTokenRefreshed(setToken);
    const sync = (event) => {
      if (event.key === LOGGED_OUT_KEY && event.newValue === "1") {
        clearAuth();
        setSessionNotice("You've been signed out.");
      }
      if (event.key !== AUTH_EVENT_KEY || !event.newValue) return;
      try {
        const { type } = JSON.parse(event.newValue);
        clearAuth();
        if (type === "login") {
          clearLoggedOutMarker();
          void restoreSession();
        } else setSessionNotice("You've been signed out.");
      } catch {
        /* Ignore unrelated or malformed storage events. */
      }
    };
    window.addEventListener("storage", sync);
    queueMicrotask(() => {
      if (mounted.current) void restoreSession();
    });
    return () => {
      mounted.current = false;
      operation.current += 1;
      unsubscribeFailure();
      unsubscribeRefresh();
      window.removeEventListener("storage", sync);
    };
  }, [clearAuth, restoreSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      sessionError,
      sessionNotice,
      retrySession: restoreSession,
      login,
      register,
      logout,
      getCurrentUser,
      changePassword,
      dashboardPath: getDashboardPath(user?.role),
    }),
    [
      user,
      accessToken,
      isLoading,
      sessionError,
      sessionNotice,
      restoreSession,
      login,
      register,
      logout,
      getCurrentUser,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
