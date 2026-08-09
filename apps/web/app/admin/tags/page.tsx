"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAdminApi } from "@/lib/admin-api";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function AdminTagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tag: any | null }>({
    isOpen: false,
    tag: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchFromAdminApi<Array<any>>("/tags")
      .then((response) => {
        setTags(response.data || []);
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

  const handleDeleteClick = (tag: any) => {
    setDeleteModal({ isOpen: true, tag });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.tag) return;

    setDeleting(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/tags/${deleteModal.tag.slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка удаления тега");
      }

      setTags(tags.filter((t) => t.id !== deleteModal.tag.id));
      setDeleteModal({ isOpen: false, tag: null });
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        alert(err instanceof Error ? err.message : "Ошибка удаления тега");
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
        <h1 className="kjar-admin__title">Управление тегами</h1>
        <div>
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
          <Link href="/admin/tags/new" className="kjar-button kjar-button--primary">
            Добавить тег
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        {error ? (
          <div className="kjar-admin__empty">
            <p>Ошибка: {error}</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Тегов пока нет</p>
            <Link href="/admin/tags/new" className="kjar-button kjar-button--primary" style={{ marginTop: "16px" }}>
              Добавить первый тег
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
                <th>Создано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.id}</td>
                  <td>{tag.name}</td>
                  <td>{tag.slug}</td>
                  <td>{new Date(tag.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td>
                    <div className="kjar-admin__actions">
                      <Link href={`/admin/tags/${tag.slug}/edit`} className="kjar-admin__action-link">
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(tag)}
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
        onClose={() => setDeleteModal({ isOpen: false, tag: null })}
        onConfirm={handleDeleteConfirm}
        title="Удалить тег?"
        message="Вы уверены, что хотите удалить этот тег? Это действие нельзя отменить."
        itemName={deleteModal.tag?.name}
        loading={deleting}
      />
    </div>
  );
}
