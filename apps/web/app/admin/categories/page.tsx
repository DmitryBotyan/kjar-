"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAdminApi } from "@/lib/admin-api";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; category: any | null }>({
    isOpen: false,
    category: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchFromAdminApi<Array<any>>("/categories")
      .then((response) => {
        setCategories(response.data || []);
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
  }, [router]);

  const handleDeleteClick = (category: any) => {
    setDeleteModal({ isOpen: true, category });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;

    setDeleting(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/categories/${deleteModal.category.slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка удаления категории");
      }

      setCategories(categories.filter((c) => c.id !== deleteModal.category.id));
      setDeleteModal({ isOpen: false, category: null });
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        alert(err instanceof Error ? err.message : "Ошибка удаления категории");
      }
    } finally {
      setDeleting(false);
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
        <h1 className="kjar-admin__title">Управление категориями</h1>
        <div>
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
          <Link href="/admin/categories/new" className="kjar-button kjar-button--primary">
            Добавить категорию
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        {error ? (
          <div className="kjar-admin__empty">
            <p>Ошибка: {error}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Категорий пока нет</p>
            <Link href="/admin/categories/new" className="kjar-button kjar-button--primary" style={{ marginTop: "16px" }}>
              Добавить первую категорию
            </Link>
          </div>
        ) : (
          <div className="kjar-admin__table-wrap">
          <table className="kjar-admin__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Slug</th>
                <th>Описание</th>
                <th>Создано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.description || "-"}</td>
                  <td>{new Date(category.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td>
                    <div className="kjar-admin__actions">
                      <Link href={`/admin/categories/${category.slug}/edit`} className="kjar-admin__action-link">
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(category)}
                        className="kjar-admin__action-link kjar-admin__action-link--danger"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", color: "#d32f2f" }}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, category: null })}
        onConfirm={handleDeleteConfirm}
        title="Удалить категорию?"
        message="Вы уверены, что хотите удалить эту категорию? Это действие нельзя отменить."
        itemName={deleteModal.category?.name}
        loading={deleting}
      />
    </div>
  );
}
