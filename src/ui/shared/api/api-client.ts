export interface HealthResponse {
  data?: {
    status?: string;
    service?: string;
    apiVersion?: string;
  };
  meta?: {
    requestId?: string;
  };
}

export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export interface ApiErrorEnvelope {
  error?: ApiErrorPayload;
  requestId?: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiClient {
  getHealth(): Promise<HealthResponse>;
  request<T>(endpoint: string, options?: RequestInit): Promise<T>;
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if ('timeout' in AbortSignal) {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function parseApiError(status: number, payload: unknown): {
  message: string;
  code?: string;
  details?: unknown;
  requestId?: string;
} {
  if (typeof payload === 'object' && payload !== null) {
    const envelope = payload as ApiErrorEnvelope & { message?: unknown };
    const requestId = typeof envelope.requestId === 'string' ? envelope.requestId : undefined;

    if (envelope.error && typeof envelope.error === 'object') {
      const { code, message, details } = envelope.error;
      return {
        message: typeof message === 'string' && message.trim() ? message : `API trả về lỗi ${status}.`,
        code: typeof code === 'string' ? code : undefined,
        details,
        requestId,
      };
    }

    if (typeof envelope.message === 'string' && envelope.message.trim()) {
      return {
        message: envelope.message,
        requestId,
      };
    }
  }

  return {
    message: `API trả về lỗi ${status}.`,
  };
}

export function createApiClient(apiBaseUrl: string, timeoutMs: number): ApiClient {
  async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (options.body && !headers.has('Content-Type') && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials || 'include',
        signal: options.signal || createTimeoutSignal(timeoutMs),
      });
    } catch {
      throw new ApiClientError('Không thể kết nối tới hệ thống.', 0, 'network_error');
    }

    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      const { message, code, details, requestId } = parseApiError(response.status, payload);
      throw new ApiClientError(message, response.status, code, details, requestId);
    }

    return (payload ?? {}) as T;
  }

  async function getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/health');
  }

  return { getHealth, request };
}
