const API_BASE_STORAGE_KEY = 'kolas_api_base_url';

declare global {
  interface Window {
    __KOLAS_API_BASE_URL__?: string;
  }
}

const normalize = (value: unknown) => String(value || '').trim().replace(/\/+$/, '');

export const isGithubPagesHost = () =>
  typeof window !== 'undefined' && window.location.hostname.toLowerCase().endsWith('github.io');

const getRuntimeApiBaseFromQuery = () => {
  if (typeof window === 'undefined') return '';
  const value = normalize(new URLSearchParams(window.location.search).get('apiBase'));
  if (!value) return '';

  try {
    localStorage.setItem(API_BASE_STORAGE_KEY, value);
  } catch {
    // ignore storage errors in private/blocked mode.
  }
  return value;
};

const getRuntimeApiBaseFromStorage = () => {
  if (typeof window === 'undefined') return '';
  try {
    return normalize(localStorage.getItem(API_BASE_STORAGE_KEY));
  } catch {
    return '';
  }
};

const getRuntimeApiBaseFromWindow = () => {
  if (typeof window === 'undefined') return '';
  return normalize(window.__KOLAS_API_BASE_URL__);
};

export const getRuntimeApiBaseUrl = () =>
  getRuntimeApiBaseFromQuery() ||
  getRuntimeApiBaseFromStorage() ||
  getRuntimeApiBaseFromWindow();

export const getEnvApiBaseUrl = () =>
  normalize(((import.meta as any).env?.VITE_API_BASE_URL || '') as string);

export const resolveConfiguredApiBaseUrl = () =>
  getEnvApiBaseUrl() ||
  getRuntimeApiBaseUrl();

export const setRuntimeApiBaseUrl = (value: string) => {
  const normalized = normalize(value);
  if (typeof window === 'undefined') return normalized;
  if (!normalized) return '';
  localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
  return normalized;
};

export const clearRuntimeApiBaseUrl = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_BASE_STORAGE_KEY);
};
