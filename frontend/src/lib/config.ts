import { env } from './env';

// Runtime configuration
let runtimeConfig: {
  API_BASE_URL: string;
} | null = null;

// Configuration loading state
let configLoading = true;

// Default fallback configuration
const defaultConfig = {
  API_BASE_URL: 'http://localhost:8000', // Only used if runtime config fails to load
};

// Function to load runtime configuration (skipped when using static build with VITE_API_BASE_URL)
export async function loadRuntimeConfig(): Promise<void> {
  if (env.VITE_API_BASE_URL) {
    configLoading = false;
    return;
  }
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        runtimeConfig = await response.json();
      }
    }
  } catch {
    // use defaultConfig
  } finally {
    configLoading = false;
  }
}

// Get current configuration (build-time env wins for static deploy)
export function getConfig() {
  if (configLoading && !env.VITE_API_BASE_URL) {
    return defaultConfig;
  }
  if (env.VITE_API_BASE_URL) {
    return { API_BASE_URL: env.VITE_API_BASE_URL };
  }
  if (runtimeConfig) {
    return runtimeConfig;
  }
  return defaultConfig;
}

/** Ensure base URL has a protocol so it's never treated as a relative path. */
function normalizeBaseURL(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return defaultConfig.API_BASE_URL;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `http://${trimmed}`;
}

// Dynamic API_BASE_URL getter - this will always return the current config
export function getAPIBaseURL(): string {
  return normalizeBaseURL(getConfig().API_BASE_URL);
}

// For backward compatibility, but this should be avoided
// Removed static export to prevent using stale config values
// export const API_BASE_URL = getAPIBaseURL();

export const config = {
  get API_BASE_URL() {
    return getAPIBaseURL();
  },
};
