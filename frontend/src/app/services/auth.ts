/**
 * Auth API client for RankForge
 * Handles signup, login, token management, and user state
 */

const API_BASE = '/api/v1/auth';
const TOKEN_KEY = 'rankforge_token';
const USER_KEY = 'rankforge_user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ── Token management ───────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function saveAuth(data: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

// ── API calls ──────────────────────────────────────────

async function authRequest<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = 'Something went wrong';
    try {
      const data = await res.json();
      detail = data.detail || data.message || detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return res.json();
}

export async function signup(name: string, email: string, password: string): Promise<AuthUser> {
  const data = await authRequest<AuthResponse>(`${API_BASE}/signup`, {
    name,
    email,
    password,
  });
  saveAuth(data);
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await authRequest<AuthResponse>(`${API_BASE}/login`, {
    email,
    password,
  });
  saveAuth(data);
  return data.user;
}

export async function getMe(): Promise<AuthUser> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/me`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }
    throw new Error('Failed to fetch user');
  }

  return res.json();
}
