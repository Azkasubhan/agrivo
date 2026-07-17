export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  '/api';


export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('agrivo_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agrivo_token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('agrivo_token');
  }
}

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  /** Request timeout in milliseconds. Defaults to 30000 (30s). Set 0 to disable. */
  timeout?: number;
}

export async function apiClient<T>(
  endpoint: string,
  { requireAuth = true, timeout = 30000, ...customConfig }: RequestOptions = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Set up abort controller for timeout
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
    signal: controller.signal,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond.');
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      // Handle unauthorized (e.g., redirect to login)
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
    const errorData = await response.json().catch(() => ({}));
    let message = '';

    if (errorData.error) {
      if (typeof errorData.error.message === 'string') {
        message = errorData.error.message;
      } else if (Array.isArray(errorData.error.details)) {
        message = errorData.error.details
          .map((d: any) => `${d.field || 'field'}: ${d.issue || 'invalid value'}`)
          .join(', ');
      }
    }

    if (!message && errorData.message) {
      message = errorData.message;
    }

    if (!message && errorData.detail) {
      if (typeof errorData.detail === 'string') {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        message = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
            return `${field}: ${err.msg}`;
          })
          .join(', ');
      } else {
        message = JSON.stringify(errorData.detail);
      }
    }

    if (!message) {
      message = `Error ${response.status}: ${response.statusText || 'An error occurred while fetching data'}`;
    }

    throw new Error(message);
  }

  return response.json();
}

