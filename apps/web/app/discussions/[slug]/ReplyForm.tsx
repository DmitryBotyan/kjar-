"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HoneypotField, useFormToken } from "../../../components/FormGuard";

// Имя запоминаем так же, как в комментариях: одно и то же поле на сайте
const NAME_STORAGE_KEY = "commentAuthorName";

export function ReplyForm({ slug }: { slug: string }) {
  const router = useRouter();
  const { formToken, refresh } = useFormToken();
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(NAME_STORAGE_KEY);
    if (saved) {
      setAuthorName(saved);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/threads/${encodeURIComponent(slug)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, content, website, formToken })
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error?.message || "Не удалось отправить ответ");
      }

      localStorage.setItem(NAME_STORAGE_KEY, authorName.trim());
      setContent("");
      refresh();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить ответ");
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="kjar-form-card kjar-thread__reply" onSubmit={handleSubmit}>
      <h2 className="kjar-thread__section-title">Ответить</h2>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor={`reply-author-${slug}`}>
          Имя или персонаж
        </label>
        <input
          className="kjar-input"
          id={`reply-author-${slug}`}
          type="text"
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          placeholder="От чьего лица отвечаете"
          minLength={2}
          maxLength={200}
          required
        />
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor={`reply-${slug}`}>
          Сообщение
        </label>
        <textarea
          className="kjar-textarea"
          id={`reply-${slug}`}
          rows={6}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Сформулируйте ответ и добавьте ссылки на хроники, если нужно."
          minLength={2}
          maxLength={20000}
          required
        />
      </div>

      <HoneypotField value={website} onChange={setWebsite} />

      {error ? (
        <p className="kjar-comments__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="kjar-form-actions">
        <button className="kjar-button kjar-button--primary" type="submit" disabled={submitting}>
          {submitting ? "Отправляем" : "Отправить ответ"}
        </button>
      </div>

      <p className="kjar-form-note">
        Ответ появится в теме сразу. Модератор может удалить его или закрыть тему.
      </p>
    </form>
  );
}
