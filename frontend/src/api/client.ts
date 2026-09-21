import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "../auth/tokens";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";

export const client = axios.create({ baseURL });

// Refresh calls go through a bare instance so they don't trigger this interceptor themselves.
const bare = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

// If several requests get a 401 at once, they all wait for the same refresh call.
let refreshing: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  refreshing ??= bare
    .post<{ access: string }>("/auth/refresh/", { refresh: getRefreshToken() })
    .then((response) => {
      setTokens(response.data.access);
      return response.data.access;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    // Login and refresh failures are real failures; everything else (incl. /auth/me/) gets one retry.
    const isAuthCall = original?.url?.includes("/auth/login/") || original?.url?.includes("/auth/refresh/");
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      throw error;
    }
    if (!getRefreshToken()) {
      clearTokens();
      throw error;
    }
    original._retried = true;
    try {
      const access = await refreshAccessToken();
      original.headers.set("Authorization", `Bearer ${access}`);
      return client(original);
    } catch {
      clearTokens(); // refresh token expired or invalid: back to the login page
      throw error;
    }
  },
);

export interface LoginResponse {
  access: string;
  refresh: string;
}

export const login = (username: string, password: string) =>
  client.post<LoginResponse>("/auth/login/", { username, password }).then((r) => r.data);

export const getMe = () => client.get<{ id: number; username: string }>("/auth/me/").then((r) => r.data);
