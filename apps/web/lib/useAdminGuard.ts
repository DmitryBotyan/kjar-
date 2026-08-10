"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Общая обработка доступа в админке: истёкший токен всегда возвращает
 * на страницу входа, остальные ошибки показываются на месте.
 * Раньше эта проверка была скопирована в каждый раздел.
 */
export function useAdminGuard() {
  const router = useRouter();

  const requireToken = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return null;
    }
    return token;
  }, [router]);

  const handleError = useCallback(
    (error: unknown, fallback: string): string => {
      const message = error instanceof Error ? error.message : fallback;
      if (message.includes("401") || message.includes("UNAUTHORIZED")) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      }
      return message;
    },
    [router]
  );

  return { requireToken, handleError };
}

/** Запрос к API админки с токеном и разбором ошибки */
export async function adminRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("authToken");

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    cache: "no-store"
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error?.message || `HTTP ${response.status}`);
  }

  return body as T;
}
