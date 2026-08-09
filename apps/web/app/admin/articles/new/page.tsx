"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchFromAdminApi } from "@/lib/admin-api";

export default function NewArticlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchFromAdminApi<Array<any>>("/categories?limit=100")
      .then((response) => {
        setCategories(response.data || []);
      })
      .catch((e) => {
        if (e.message.includes("401") || e.message.includes("UNAUTHORIZED")) {
          localStorage.removeItem("authToken");
          router.push("/admin");
        } else {
          setError(e instanceof Error ? e.message : "Ошибка загрузки категорий");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      slug: formData.get("slug") || undefined,
      summary: formData.get("summary") || null,
      lead: formData.get("lead") || null,
      contentMd: formData.get("contentMd") || null,
      categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : null,
      era: formData.get("era") || null,
      status: formData.get("status") || "draft",
    };

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка создания статьи");
      }

      router.push("/admin/articles");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка создания статьи");
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

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Создать статью</h1>
        <Link href="/admin/articles" className="kjar-button kjar-button--ghost">
          Назад
        </Link>
      </div>

      <div className="kjar-admin__content">
        <form className="kjar-form-card" onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: "12px", background: "rgba(211, 47, 47, 0.1)", border: "1px solid #d32f2f", borderRadius: "6px", color: "#d32f2f" }}>
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

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="lead">
              Лид
            </label>
            <textarea
              className="kjar-textarea"
              id="lead"
              name="lead"
              rows={3}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="contentMd">
              Содержание (Markdown)
            </label>
            <textarea
              className="kjar-textarea"
              id="contentMd"
              name="contentMd"
              rows={10}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="categoryId">
              Категория
            </label>
            <select className="kjar-select" id="categoryId" name="categoryId" defaultValue="">
              <option value="">Не выбрано</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="status">
              Статус
            </label>
            <select className="kjar-select" id="status" name="status" defaultValue="draft">
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
              <option value="archived">Архив</option>
            </select>
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="era">
              Эпоха
            </label>
            <select className="kjar-select" id="era" name="era" defaultValue="">
              <option value="">Не указано</option>
              <option value="first">Первая</option>
              <option value="second">Вторая</option>
              <option value="any">Любая</option>
            </select>
          </div>

          <div className="kjar-form-actions">
            <button
              type="submit"
              className="kjar-button kjar-button--primary"
              disabled={saving}
            >
              {saving ? "Создание..." : "Создать статью"}
            </button>
            <Link href="/admin/articles" className="kjar-button kjar-button--ghost">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
