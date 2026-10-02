"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";
import DictionarySelect from "@/components/admin/DictionarySelect";

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const publishedAtValue = formData.get("publishedAt");
    let publishedAt: string | null = null;
    if (publishedAtValue && typeof publishedAtValue === "string" && publishedAtValue.trim() !== "") {
      publishedAt = new Date(publishedAtValue).toISOString();
    }
    
    const data = {
      title: formData.get("title"),
      slug: formData.get("slug") || undefined,
      summary: formData.get("summary") || null,
      content: formData.get("content") || null,
      image: imageUrl,
      publishedAt,
      isEvent: true,
      eventType: formData.get("eventType") || null,
      eventFormat: formData.get("eventFormat") || null,
      participationType: formData.get("participationType") || null,
    };

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка создания события");
      }

      router.push("/admin/events");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка создания события");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Создать событие</h1>
        <Link href="/admin/events" className="kjar-button kjar-button--ghost">
          Назад
        </Link>
      </div>

      <div className="kjar-admin__content">
        <form className="kjar-form-card" onSubmit={handleSubmit}>
          {error && (
            <div className="kjar-admin__error">
              {error}
            </div>
          )}

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="title">
              Название *
            </label>
            <input
              className="kjar-input"
              id="title"
              name="title"
              type="text"
              required
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="slug">
              Slug (оставьте пустым для автогенерации)
            </label>
            <input
              className="kjar-input"
              id="slug"
              name="slug"
              type="text"
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="summary">
              Краткое описание
            </label>
            <textarea
              className="kjar-textarea"
              id="summary"
              name="summary"
              rows={3}
            />
          </div>

          <ImageUpload
            value={imageUrl || undefined}
            onChange={setImageUrl}
            folder="posts"
            label="Изображение события"
          />

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="content">
              Содержание (Markdown)
            </label>
            <textarea
              className="kjar-textarea"
              id="content"
              name="content"
              rows={10}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="publishedAt">
              Дата публикации
            </label>
            <input
              className="kjar-input"
              id="publishedAt"
              name="publishedAt"
              type="datetime-local"
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="eventType">
              Тип ивента
            </label>
            <DictionarySelect
              group="event_type"
              id="eventType"
              name="eventType"
              emptyLabel="Не указано"
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="eventFormat">
              Формат ивента
            </label>
            <DictionarySelect
              group="event_format"
              id="eventFormat"
              name="eventFormat"
              emptyLabel="Не указано"
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="participationType">
              Тип участия
            </label>
            <DictionarySelect
              group="participation_type"
              id="participationType"
              name="participationType"
              emptyLabel="Не указано"
            />
          </div>

          <div className="kjar-form-actions">
            <button
              type="submit"
              className="kjar-button kjar-button--primary"
              disabled={saving}
            >
              {saving ? "Создание..." : "Создать событие"}
            </button>
            <Link href="/admin/events" className="kjar-button kjar-button--ghost">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
