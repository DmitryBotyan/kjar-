"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

type Hit = { type: string; title: string; text: string | null; href: string };

export default function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { data: [] }))
        .then((body) => {
          setHits(body.data || []);
          setActive(0);
          setLoading(false);
        })
        .catch((error) => {
          if (error.name !== "AbortError") setLoading(false);
        });
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const go = (hit: Hit | undefined) => {
    if (!hit) return;
    setOpen(false);
    router.push(hit.href);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const term = query.trim();

  return (
    <div className={`kjar-searchbox${open ? " kjar-searchbox--open" : ""}`} ref={rootRef}>
      {open ? (
        <div className="kjar-searchbox__field">
          <Search className="kjar-searchbox__icon" aria-hidden="true" />
          <input
            ref={inputRef}
            className="kjar-searchbox__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Кьяр, тьорн, статья"
            aria-label="Поиск по сайту"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls="kjar-search-hits"
            aria-activedescendant={hits.length > 0 ? `kjar-hit-${active}` : undefined}
            autoComplete="off"
          />
          <button
            type="button"
            className="kjar-searchbox__close"
            onClick={() => setOpen(false)}
            aria-label="Закрыть поиск"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="kjar-search"
          onClick={() => setOpen(true)}
          title="Поиск по сайту"
        >
          <Search className="kjar-search__icon" aria-hidden="true" />
          <span className="kjar-sr-only">Поиск по сайту</span>
        </button>
      )}

      {open && term.length >= 2 && (
        <div className="kjar-searchbox__panel">
          {hits.length > 0 ? (
            <ul className="kjar-searchbox__list" id="kjar-search-hits" role="listbox">
              {hits.map((hit, index) => (
                <li
                  key={hit.href}
                  id={`kjar-hit-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={`kjar-searchbox__hit${index === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    go(hit);
                  }}
                >
                  <span className="kjar-searchbox__type">{hit.type}</span>
                  <span className="kjar-searchbox__title">{hit.title}</span>
                  {hit.text && <span className="kjar-searchbox__text">{hit.text}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="kjar-searchbox__empty">
              {loading ? "Ищем…" : `По запросу «${term}» ничего нет`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
