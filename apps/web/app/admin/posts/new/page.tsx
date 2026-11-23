"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";
import DictionarySelect from "@/components/admin/DictionarySelect";
import MarkdownField from "@/components/admin/MarkdownField";

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEvent, setIsEvent] = useState(false);

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
      isEvent: formData.get("isEvent") === "true",
      eventType: formData.get("eventType") || null,
      eventFormat: formData.get("eventFormat") || null,
      participationType: formData.get("participationType") || null,
      eventAudience: formData.get("eventAudience") || null,
      section: formData.get("section") || null,
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
        throw new Error(errorData.error?.message || "Ошибка создания поста");
      }

      router.push("/admin/posts");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка создания поста");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Создать пост</h1>
        <Link href="/admin/posts" className="kjar-button kjar-button--ghost">
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
            label="Изображение поста"
          />

          <MarkdownField
            id="content"
            name="content"
            label="Содержание поста"
            folder="posts"
            rows={14}
          />

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
            <label className="kjar-label" htmlFor="section">
              Раздел
            </label>
            <DictionarySelect
              group="post_section"
              id="section"
              name="section"
              emptyLabel="Без раздела"
            />
            <p className="kjar-admin__note">Разделы «Расписание» и «Торговая площадь» открываются из меню сайта.</p>
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="isEvent">
              Это ивент?
            </label>
            <select 
              className="kjar-select" 
              id="isEvent" 
              name="isEvent" 
              defaultValue="false"
              onChange={(e) => setIsEvent(e.target.value === "true")}
            >
              <option value="false">Нет</option>
              <option value="true">Да</option>
            </select>
          </div>

          {isEvent && (
            <>
              <div className="kjar-field">
                <label className="kjar-label" htmlFor="eventType">
                  Раздел ивента
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
                  Механика ивента
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
                  Тип: участие
                </label>
                <DictionarySelect
                  group="participation_type"
                  id="participationType"
                  name="participationType"
                  emptyLabel="Не указано"
                />
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="eventAudience">
                  Формат: для кого
                </label>
                <DictionarySelect
                  group="event_audience"
                  id="eventAudience"
                  name="eventAudience"
                  emptyLabel="Не указано"
                />
              </div>
            </>
          )}

          <div className="kjar-form-actions">
            <button
              type="submit"
              className="kjar-button kjar-button--primary"
              disabled={saving}
            >
              {saving ? "Создание..." : "Создать пост"}
            </button>
            <Link href="/admin/posts" className="kjar-button kjar-button--ghost">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
