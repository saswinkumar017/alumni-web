import type { SessionUser } from "@/types";
import { useAuthStore } from "@/stores/global";
import type { AuthStoreAdapter } from "./auth-service.types";

let authToken: string | null = null;

export function createAuthStoreAdapter(): AuthStoreAdapter {
  function login(user: SessionUser): void {
    useAuthStore.getState().login(user);
  }

  function logout(): void {
    useAuthStore.getState().logout();
  }

  function setUser(user: SessionUser): void {
    useAuthStore.getState().setUser(user);
  }

  function setLoading(): void {
    useAuthStore.getState().setLoading();
  }

  function setError(error: string): void {
    useAuthStore.getState().setError(error);
  }

  function hydrate(user: SessionUser): void {
    useAuthStore.getState().hydrate(user);
  }

  function reset(): void {
    useAuthStore.getState().reset();
  }

  return { login, logout, setUser, setLoading, setError, hydrate, reset };
}

export function createTokenStore() {
  function getAuthToken(): string | null {
    return authToken;
  }

  function setAuthToken(token: string): void {
    authToken = token;
  }

  function clearAuthToken(): void {
    authToken = null;
  }

  function getUser(): SessionUser | null {
    return useAuthStore.getState().user;
  }

  return { getAuthToken, setAuthToken, clearAuthToken, getUser };
}