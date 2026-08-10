"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchFromAdminApi } from "@/lib/admin-api";
import ImageUpload from "@/components/admin/ImageUpload";
import PollManager from "@/components/admin/PollManager";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchFromAdminApi<any>(`/events/${slug}`)
      .then((response) => {
        setEvent(response.data);
        setImageUrl(response.data.image || null);
      })
      .catch((e) => {
        if (e.message.includes("401") || e.message.includes("UNAUTHORIZED")) {
          localStorage.removeItem("authToken");
          router.push("/admin");
        } else {
          setError(e instanceof Error ? e.message : "Ошибка загрузки");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Преобразуем datetime-local в ISO формат
    const publishedAtValue = formData.get("publishedAt");
    let publishedAt: string | null = null;
    if (publishedAtValue && typeof publishedAtValue === "string" && publishedAtValue.trim() !== "") {
      // datetime-local возвращает формат YYYY-MM-DDTHH:mm, нужно добавить секунды и timezone
      publishedAt = new Date(publishedAtValue).toISOString();
    }
    
    const data = {
      title: formData.get("title"),
      slug: formData.get("slug"),
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
      const response = await fetch(`/api/posts/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка обновления ивента");
      }

      router.push("/admin/events");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка обновления ивента");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="kjar-admin">
        <div className="kjar-admin__loading">Загрузка...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="kjar-admin">
        <div className="kjar-admin__empty">
          <p>Ивент не найден</p>
          <Link href="/admin/events" className="kjar-button kjar-button--primary">
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Редактировать ивент</h1>
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
              defaultValue={event.title}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="slug">
              Slug *
            </label>
            <input
              className="kjar-input"
              id="slug"
              name="slug"
              type="text"
              required
              defaultValue={event.slug}
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
              defaultValue={event.summary || ""}
            />
          </div>

          <ImageUpload
            value={imageUrl || undefined}
            onChange={setImageUrl}
            folder="events"
            label="Изображение ивента"
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
              defaultValue={event.content || ""}
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
              defaultValue={event.publishedAt ? new Date(event.publishedAt).toISOString().slice(0, 16) : ""}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="eventType">
              Тип ивента
            </label>
            <select className="kjar-select" id="eventType" name="eventType" defaultValue={event.eventType || ""}>
              <option value="">Не указано</option>
              <option value="single">Одноэтапный</option>
              <option value="multi-stage">Многоэтапный</option>
            </select>
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="eventFormat">
              Формат ивента
            </label>
            <select className="kjar-select" id="eventFormat" name="eventFormat" defaultValue={event.eventFormat || ""}>
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
            <select className="kjar-select" id="participationType" name="participationType" defaultValue={event.participationType || ""}>
              <option value="">Не указано</option>
              <option value="individual">Индивидуальное</option>
              <option value="mass">Массовое</option>
            </select>
          </div>

          {event.eventFormat === "poll" && (
            <PollManager postId={event.id} eventFormat={event.eventFormat} />
          )}

          <div className="kjar-form-actions">
            <button
              type="submit"
              className="kjar-button kjar-button--primary"
              disabled={saving}
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
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
