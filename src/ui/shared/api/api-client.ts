export interface HealthResponse {
  status?: string;
  data?: {
    status?: string;
  };
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiClient {
  getHealth(): Promise<HealthResponse>;
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if ('timeout' in AbortSignal) {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function getErrorMessage(status: number, payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return `API trả về lỗi ${status}.`;
}

export function createApiClient(apiBaseUrl: string, timeoutMs: number): ApiClient {
  async function getHealth(): Promise<HealthResponse> {
    let response: Response;

    try {
      response = await fetch(`${apiBaseUrl}/health`, {
        headers: { Accept: 'application/json' },
        signal: createTimeoutSignal(timeoutMs),
      });
    } catch {
      throw new ApiClientError('Không thể kết nối tới API.');
    }

    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new ApiClientError(getErrorMessage(response.status, payload), response.status);
    }

    return (payload || {}) as HealthResponse;
  }

  return { getHealth };
}
