"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchFromAdminApi } from "@/lib/admin-api";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    // Получаем категорию из списка
    fetchFromAdminApi<Array<any>>("/categories")
      .then((response) => {
        const found = response.data.find((c: any) => c.slug === slug);
        if (found) {
          setCategory(found);
        } else {
          setError("Категория не найдена");
        }
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
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") || null,
    };

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/categories/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка обновления категории");
      }

      router.push("/admin/categories");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка обновления категории");
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

  if (!category) {
    return (
      <div className="kjar-admin">
        <div className="kjar-admin__empty">
          <p>Категория не найдена</p>
          <Link href="/admin/categories" className="kjar-button kjar-button--primary">
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Редактировать категорию</h1>
        <Link href="/admin/categories" className="kjar-button kjar-button--ghost">
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
            <label className="kjar-label" htmlFor="name">
              Название *
            </label>
            <input
              className="kjar-input"
              id="name"
              name="name"
              type="text"
              required
              defaultValue={category.name}
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
              defaultValue={category.slug}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="description">
              Описание
            </label>
            <textarea
              className="kjar-textarea"
              id="description"
              name="description"
              rows={5}
              defaultValue={category.description || ""}
            />
          </div>

          <div className="kjar-form-actions">
            <button
              type="submit"
              className="kjar-button kjar-button--primary"
              disabled={saving}
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </button>
            <Link href="/admin/categories" className="kjar-button kjar-button--ghost">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
