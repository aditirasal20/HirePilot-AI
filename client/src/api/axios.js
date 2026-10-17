import axios from "axios";
import { API_BASE_URL } from "../config/env";
import {
  clearAuthStorage,
  hasLoggedOutMarker,
} from "../services/storage.service";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
let accessToken = null;
let generation = 0;
let refreshPromise = null;
let authFailureHandler = null;
let tokenRefreshedHandler = null;
clearAuthStorage();

export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;
export const getSessionGeneration = () => generation;
export const resetSession = () => {
  generation += 1;
  accessToken = null;
  refreshPromise = null;
  clearAuthStorage();
};
export const onAuthFailure = (handler) => {
  authFailureHandler = handler;
  return () => {
    if (authFailureHandler === handler) authFailureHandler = null;
  };
};
export const onTokenRefreshed = (handler) => {
  tokenRefreshedHandler = handler;
  return () => {
    if (tokenRefreshedHandler === handler) tokenRefreshedHandler = null;
  };
};
let localLock = Promise.resolve();
export const withSessionLock = (callback) => {
  const promise = localLock.then(() =>
    globalThis.navigator?.locks?.request
      ? navigator.locks.request("hirepilot-auth-session", callback)
      : callback(),
  );
  localLock = promise.catch(() => {});
  return promise;
};

const publicEndpoints = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
];
const isPublic = (url = "") => publicEndpoints.includes(url.split("?")[0]);
const cancelledSession = () =>
  new axios.CanceledError("The session has changed.");

export function refreshSession() {
  if (hasLoggedOutMarker()) return Promise.reject(cancelledSession());
  if (refreshPromise) return refreshPromise;
  const started = generation;
  const promise = withSessionLock(async () => {
    if (started !== generation || hasLoggedOutMarker())
      throw cancelledSession();
    const response = await api.post("/auth/refresh");
    const data = response.data?.data ?? response.data;
    if (started !== generation || hasLoggedOutMarker())
      throw cancelledSession();
    if (!data?.accessToken)
      throw new Error("Could not restore your session. Please try again.");
    setAccessToken(data.accessToken);
    tokenRefreshedHandler?.(data.accessToken);
    return data;
  });
  refreshPromise = promise;
  const cleanup = () => {
    if (refreshPromise === promise) refreshPromise = null;
  };
  promise.then(cleanup, cleanup);
  return promise;
}

api.interceptors.request.use((config) => {
  config._authGeneration ??= generation;
  if (!isPublic(config.url)) {
    if (config._authGeneration !== generation) throw cancelledSession();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    else config.headers.delete("Authorization");
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (
      !isPublic(response.config.url) &&
      response.config._authGeneration !== generation
    )
      throw cancelledSession();
    return response;
  },
  async (error) => {
    const request = error.config;
    if (
      !request ||
      error.response?.status !== 401 ||
      isPublic(request.url) ||
      request.url === "/auth/logout"
    )
      throw error;
    if (request._authGeneration !== generation || hasLoggedOutMarker())
      throw cancelledSession();
    if (request._retry) {
      resetSession();
      authFailureHandler?.();
      throw error;
    }
    request._retry = true;
    // Another request may have refreshed the token while this response was in flight.
    if (
      accessToken &&
      request.headers.Authorization !== `Bearer ${accessToken}`
    )
      return api(request);
    try {
      await refreshSession();
    } catch (refreshError) {
      if (
        request._authGeneration === generation &&
        [401, 403].includes(refreshError.response?.status)
      ) {
        resetSession();
        authFailureHandler?.();
      }
      throw refreshError;
    }
    return api(request);
  },
);
export default api;
