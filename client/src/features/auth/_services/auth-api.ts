import { env } from "@/config/env";

const API_BASE = env.api.baseUrl;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  username: string;
  role: string;
}

export interface RegisterRequest {
  registerNumber: string;
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  userId: number;
  username: string;
  message: string;
}

export interface VerifyResponse {
  userId: number;
  username: string;
  message: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  fieldErrors?: Array<{
    field: string;
    rejectedValue: unknown;
    message: string;
  }>;
}

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("Unable to connect to server. Please try again later.");
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error("Invalid response from server. Please try again later.");
  }

  if (!res.ok) {
    const error = body as ApiError;
    throw new Error(error.message || "Invalid credentials");
  }

  return body as LoginResponse;
}

export async function registerApi(data: RegisterRequest): Promise<RegisterResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("Unable to connect to server. Please try again later.");
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error("Invalid response from server. Please try again later.");
  }

  if (!res.ok) {
    const error = body as ApiError;
    if (error.fieldErrors && error.fieldErrors.length > 0) {
      const messages = error.fieldErrors.map((f) => f.message).join(", ");
      throw new Error(messages);
    }
    throw new Error(error.message || "Registration failed");
  }

  return body as RegisterResponse;
}

export async function verifyEmailApi(token: string): Promise<VerifyResponse> {
  const res = await fetch(
    `${API_BASE}/auth/verify?token=${encodeURIComponent(token)}`
  );

  const body = await res.json();

  if (!res.ok) {
    const error = body as ApiError;
    throw new Error(error.message || "Verification failed");
  }

  return body as VerifyResponse;
}

export async function verifyRegistrationOtp(username: string, otp: string): Promise<{ message: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, otp, purpose: "REGISTRATION" }),
    });
  } catch {
    throw new Error("Unable to connect to server. Please try again later.");
  }

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || "OTP verification failed");
  }

  return body as { message: string };
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function storeAuthTokens(data: LoginResponse): void {
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  const normalizedRole = data.role?.toLowerCase() ?? "alumni";
  localStorage.setItem(
    "user",
    JSON.stringify({ username: data.username, role: normalizedRole })
  );
  setCookie("session_token", data.accessToken, 7);
  setCookie("user_role", normalizedRole, 7);
}

export function clearAuthTokens(): void {
  const token = localStorage.getItem("accessToken");
  // Fire-and-forget: revoke session on backend
  if (token) {
    fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  deleteCookie("session_token");
  deleteCookie("user_role");
}

export function getStoredUser(): { username: string; role: string } | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
