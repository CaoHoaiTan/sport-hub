const REFRESH_TOKEN_KEY = 'sporthub_refresh_token';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setTokens(access: string, refresh: string): void {
  setAccessToken(access);
  setRefreshToken(refresh);
}

export function clearTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}
