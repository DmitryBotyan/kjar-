"use client";

import { useEffect, useState } from "react";
import type { DictionaryEntry, DictionaryGroup } from "./dictionaries";

// Формы админки запрашивают по справочнику каждая; кэш в памяти вкладки
// избавляет от повторных запросов при переходах между страницами.
const cache = new Map<DictionaryGroup, DictionaryEntry[]>();
const inFlight = new Map<DictionaryGroup, Promise<DictionaryEntry[]>>();

async function load(group: DictionaryGroup): Promise<DictionaryEntry[]> {
  const cached = cache.get(group);
  if (cached) return cached;

  const pending = inFlight.get(group);
  if (pending) return pending;

  const request = fetch(`/api/dictionaries?group=${encodeURIComponent(group)}`, {
    cache: "no-store"
  })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((body) => {
      const entries: DictionaryEntry[] = body?.data || [];
      cache.set(group, entries);
      return entries;
    })
    .finally(() => {
      inFlight.delete(group);
    });

  inFlight.set(group, request);
  return request;
}

/** Сбрасывает кэш после правки справочника в админке. */
export function invalidateDictionary(group?: DictionaryGroup) {
  if (group) {
    cache.delete(group);
  } else {
    cache.clear();
  }
}

export function useDictionary(group: DictionaryGroup) {
  const [entries, setEntries] = useState<DictionaryEntry[]>(
    () => cache.get(group) || []
  );
  const [loading, setLoading] = useState(!cache.has(group));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    load(group)
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [group]);

  return { entries, loading, error };
}
