"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchFromAdminApi } from "@/lib/admin-api";

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    // Загружаем статью и категории параллельно
    Promise.all([
      fetchFromAdminApi<any>(`/articles/${slug}`),
      fetchFromAdminApi<Array<any>>("/categories?limit=100"),
    ])
      .then(([articleResponse, categoriesResponse]) => {
        setArticle(articleResponse.data);
        setCategories(categoriesResponse.data || []);
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
    const data = {
      title: formData.get("title"),
      slug: formData.get("slug"),
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
      const response = await fetch(`/api/articles/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка обновления статьи");
      }

      router.push("/admin/articles");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка обновления статьи");
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

  if (!article) {
    return (
      <div className="kjar-admin">
        <div className="kjar-admin__empty">
          <p>Статья не найдена</p>
          <Link href="/admin/articles" className="kjar-button kjar-button--primary">
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Редактировать статью</h1>
        <Link href="/admin/articles" className="kjar-button kjar-button--ghost">
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
              defaultValue={article.title}
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
              defaultValue={article.slug}
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
              defaultValue={article.summary || ""}
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
              defaultValue={article.lead || ""}
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
              defaultValue={article.contentMd || ""}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="categoryId">
              Категория
            </label>
            <select className="kjar-select" id="categoryId" name="categoryId" defaultValue={article.categoryId || ""}>
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
            <select className="kjar-select" id="status" name="status" defaultValue={article.status || "draft"}>
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
              <option value="archived">Архив</option>
            </select>
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="era">
              Эпоха
            </label>
            <select className="kjar-select" id="era" name="era" defaultValue={article.era || ""}>
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
              {saving ? "Сохранение..." : "Сохранить изменения"}
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
