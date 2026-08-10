"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

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
    
    // Преобразуем datetime-local в ISO формат
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
                  Тип ивента
                </label>
                <select className="kjar-select" id="eventType" name="eventType" defaultValue="">
                  <option value="">Не указано</option>
                  <option value="single">Одноэтапный</option>
                  <option value="multi-stage">Многоэтапный</option>
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="eventFormat">
                  Формат ивента
                </label>
                <select className="kjar-select" id="eventFormat" name="eventFormat" defaultValue="">
                  <option value="">Не указано</option>
                  <option value="poll">Опрос</option>
                  <option value="riddle">Загадка</option>
                  <option value="puzzle">Головоломка</option>
                  <option value="crossword">Кроссворд</option>
                  <option value="quest">Квест</option>
                  <option value="creative">Творческий</option>
                  <option value="choice">Выбор</option>
                  <option value="word-search">Поиск слов</option>
                  <option value="image-search">Поиск изображений</option>
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="participationType">
                  Тип участия
                </label>
                <select className="kjar-select" id="participationType" name="participationType" defaultValue="">
                  <option value="">Не указано</option>
                  <option value="individual">Индивидуальное</option>
                  <option value="mass">Массовое</option>
                </select>
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
