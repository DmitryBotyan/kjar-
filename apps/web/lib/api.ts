
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

export async function fetchFromApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // В Server Components fetch требует абсолютный URL
  // Серверные компоненты ходят в собственный прокси /api. Делать это через
  // публичный домен незачем: лишний выход наружу и зависимость от DNS и TLS
  // внутри контейнера. Поэтому всегда обращаемся к себе по локальному адресу.
  const getBaseUrl = () => {
    const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || "3000";
    return `http://127.0.0.1:${port}`;
  };

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${API_BASE_PATH}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: options.cache || "no-store",
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

export async function getArticles(params?: {
  category?: string;
  status?: string;
  era?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  // Передаём путь без /api/v1 - прокси сам добавит его
  return fetchFromApi<Array<any>>(`/articles${queryString ? `?${queryString}` : ""}`);
}

export async function getArticleBySlug(slug: string) {
  return fetchFromApi<any>(`/articles/${slug}`);
}

export async function getCharacters(params?: {
  role?: string;
  status?: string;
  species?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  return fetchFromApi<Array<any>>(`/characters${queryString ? `?${queryString}` : ""}`);
}

export async function getCharacterBySlug(slug: string) {
  return fetchFromApi<any>(`/characters/${slug}`);
}

export async function getPosts(params?: {
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  return fetchFromApi<Array<any>>(`/posts${queryString ? `?${queryString}` : ""}`);
}

export async function getPostBySlug(slug: string) {
  return fetchFromApi<any>(`/posts/${slug}`);
}

export async function getEvents(params?: {
  eventType?: string;
  eventFormat?: string;
  participationType?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  return fetchFromApi<Array<any>>(`/events${queryString ? `?${queryString}` : ""}`);
}

export async function getEventBySlug(slug: string) {
  return fetchFromApi<any>(`/events/${slug}`);
}

export async function getThreads(params?: {
  category?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  return fetchFromApi<Array<any>>(`/threads${queryString ? `?${queryString}` : ""}`);
}

export async function getThreadBySlug(slug: string) {
  return fetchFromApi<any>(`/threads/${slug}`);
}

export async function getCategories() {
  return fetchFromApi<Array<any>>("/categories");
}

export async function getTags() {
  return fetchFromApi<Array<any>>("/tags");
}

export async function getNormans() {
  return fetchFromApi<Array<any>>("/normans");
}

export async function getNormanBySlug(slug: string) {
  return fetchFromApi<any>(`/normans/${slug}`);
}
