"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HoneypotField, useFormToken } from "../../../components/FormGuard";

interface NewThreadFormProps {
  categories: string[];
  knownTags: string[];
}

export function NewThreadForm({ categories, knownTags }: NewThreadFormProps) {
  const router = useRouter();
  const { formToken, refresh } = useFormToken();
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(values.get("title") || ""),
          category: String(values.get("category") || "") || undefined,
          authorName: String(values.get("authorName") || ""),
          content: String(values.get("content") || ""),
          tags: String(values.get("tags") || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          website,
          formToken
        })
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error?.message || "Не удалось создать тему");
      }

      router.push(`/discussions/${body.data.slug}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось создать тему");
      refresh();
      setSubmitting(false);
    }
  };

  return (
    <form className="kjar-form-card" onSubmit={handleSubmit}>
      <div className="kjar-field">
        <label className="kjar-label" htmlFor="thread-title">
          Название темы
        </label>
        <input
          className="kjar-input"
          id="thread-title"
          name="title"
          type="text"
          placeholder="Коротко обозначьте вопрос или задачу"
          minLength={5}
          maxLength={500}
          required
        />
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="thread-category">
          Раздел
        </label>
        <input
          className="kjar-input"
          id="thread-category"
          name="category"
          type="text"
          list="thread-categories"
          placeholder="Выберите из списка или впишите свой"
          maxLength={100}
        />
        <datalist id="thread-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="thread-author">
          Имя или персонаж
        </label>
        <input
          className="kjar-input"
          id="thread-author"
          name="authorName"
          type="text"
          placeholder="От чьего лица открываете тему"
          minLength={2}
          maxLength={200}
          required
        />
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="thread-tags">
          Теги
        </label>
        <input
          className="kjar-input"
          id="thread-tags"
          name="tags"
          type="text"
          list="thread-tags-list"
          placeholder="Через запятую, из уже заведённых"
          maxLength={300}
        />
        <datalist id="thread-tags-list">
          {knownTags.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="thread-message">
          Описание
        </label>
        <textarea
          className="kjar-textarea"
          id="thread-message"
          name="content"
          rows={8}
          placeholder="Раскройте контекст, приложите ссылки и вопросы."
          minLength={10}
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
          {submitting ? "Создаём" : "Создать тему"}
        </button>
        <button className="kjar-button kjar-button--ghost" type="reset" disabled={submitting}>
          Очистить
        </button>
      </div>

      <p className="kjar-form-note">
        Тема появится в списке обсуждений сразу, модератор может её закрепить или закрыть.
      </p>
    </form>
  );
}
