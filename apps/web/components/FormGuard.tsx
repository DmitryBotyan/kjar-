"use client";

import { useEffect, useState } from "react";

/**
 * Токен формы берём у сервера при открытии страницы. Он подписан и живёт
 * два часа, поэтому подтверждает, что форму действительно открывали.
 */
export function useFormToken() {
  const [formToken, setFormToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/form-token")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled && body?.data?.formToken) {
          setFormToken(body.data.formToken);
        }
      })
      .catch(() => {
        // Молчим: без токена отправка вернёт понятную ошибку от сервера
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // После отправки токен одноразовый, поэтому запрашиваем следующий
  const refresh = () => {
    fetch("/api/form-token")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (body?.data?.formToken) {
          setFormToken(body.data.formToken);
        }
      })
      .catch(() => {});
  };

  return { formToken, refresh };
}

/**
 * Ловушка для автозаполнения: человек это поле не видит и не заполняет,
 * а робот заполняет — и отправка отклоняется.
 */
export function HoneypotField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div className="kjar-sr-only" aria-hidden="true">
      <label htmlFor="website-field">Не заполняйте это поле</label>
      <input
        id="website-field"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
