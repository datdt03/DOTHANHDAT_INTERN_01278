export interface RuntimeConfig {
  apiBaseUrl: string;
  apiTimeoutMs: number;
  previewMode: boolean;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

const queryParams = new URLSearchParams(window.location.search);

export const runtimeConfig: RuntimeConfig = {
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'),
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 5000),
  previewMode: import.meta.env.VITE_UI_PREVIEW !== 'false' && queryParams.get('live') !== '1',
};
