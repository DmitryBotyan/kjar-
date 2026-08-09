/**
 * Утилиты для работы с API в админке
 * Использует токен из localStorage для аутентификации
 */

const API_BASE_PATH = "/api";

export interface ApiResponse<T> {
  data: T;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.origin;
}

/**
 * Выполняет запрос к API с токеном из localStorage
 */
export async function fetchFromAdminApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${API_BASE_PATH}${endpoint}`;
  const token = getAuthToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    let error: ApiError;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = {
        error: {
          code: "UNKNOWN_ERROR",
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      };
    }

    throw new Error(error.error.message || `API request failed: ${response.status}`);
  }

  const jsonData = await response.json();
  
  return jsonData;
}
