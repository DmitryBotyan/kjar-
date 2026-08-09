/**
 * Утилита для выполнения запросов к Express API на сервере Next.js
 * Все запросы выполняются на сервере через Next.js API прокси, клиент не имеет прямого доступа к API
 * 
 * Используем относительные пути - они будут проксироваться через /app/api/[...path]/route.ts
 */

// В Server Components Next.js автоматически создаёт абсолютный URL из относительного
// Используем относительный путь, чтобы запросы шли через Next.js прокси
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

/**
 * Выполняет запрос к Express API на сервере через Next.js прокси
 * Использует абсолютный URL к Next.js прокси, который затем проксирует запрос к Express API
 */
export async function fetchFromApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // В Server Components fetch требует абсолютный URL
  // Определяем базовый URL Next.js приложения
  const getBaseUrl = () => {
    // В production используем переменную окружения или определяем автоматически
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    
    // В Vercel используем автоматически определяемый URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // В Docker или dev окружении Next.js обычно работает на localhost:3000
    // Внутри Docker контейнера localhost указывает на сам контейнер, что нам и нужно
    const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3000';
    return process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' // Замените на ваш production домен
      : `http://localhost:${port}`;
  };
  
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${API_BASE_PATH}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    // Не кэшируем по умолчанию, чтобы всегда получать актуальные данные
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

/**
 * Получить список статей
 */
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

/**
 * Получить статью по slug
 */
export async function getArticleBySlug(slug: string) {
  return fetchFromApi<any>(`/articles/${slug}`);
}

/**
 * Получить список персонажей
 */
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

/**
 * Получить персонажа по slug
 */
export async function getCharacterBySlug(slug: string) {
  return fetchFromApi<any>(`/characters/${slug}`);
}

/**
 * Получить список постов
 */
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

/**
 * Получить пост по slug
 */
export async function getPostBySlug(slug: string) {
  return fetchFromApi<any>(`/posts/${slug}`);
}

/**
 * Получить список ивентов (постов с isEvent = true)
 */
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

/**
 * Получить ивент по slug
 */
export async function getEventBySlug(slug: string) {
  return fetchFromApi<any>(`/events/${slug}`);
}

/**
 * Получить список обсуждений
 */
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

/**
 * Получить обсуждение по slug
 */
export async function getThreadBySlug(slug: string) {
  return fetchFromApi<any>(`/threads/${slug}`);
}

/**
 * Получить список категорий
 */
export async function getCategories() {
  return fetchFromApi<Array<any>>("/categories");
}

/**
 * Получить список тегов
 */
export async function getTags() {
  return fetchFromApi<Array<any>>("/tags");
}
