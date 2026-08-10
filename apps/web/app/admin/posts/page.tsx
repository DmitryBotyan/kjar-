"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAdminApi } from "@/lib/admin-api";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; post: any | null }>({
    isOpen: false,
    post: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchFromAdminApi<Array<any>>("/posts?limit=100")
      .then((response) => {
        setPosts(response.data || []);
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

  const handleDeleteClick = (post: any) => {
    setDeleteModal({ isOpen: true, post });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.post) return;

    setDeleting(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/posts/${deleteModal.post.slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка удаления поста");
      }

      // Обновляем список постов
      setPosts(posts.filter((p) => p.id !== deleteModal.post.id));
      setDeleteModal({ isOpen: false, post: null });
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        alert(err instanceof Error ? err.message : "Ошибка удаления поста");
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
        <h1 className="kjar-admin__title">Управление постами</h1>
        <div>
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
          <Link href="/admin/posts/new" className="kjar-button kjar-button--primary">
            Добавить пост
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        {error ? (
          <div className="kjar-admin__empty">
            <p>Ошибка: {error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Постов пока нет</p>
            <Link href="/admin/posts/new" className="kjar-button kjar-button--primary">
              Добавить первый пост
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
                <th>Ивент</th>
                <th>Опубликовано</th>
                <th>Создано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td>{post.title}</td>
                  <td>{post.slug}</td>
                  <td>{post.isEvent ? "Да" : "Нет"}</td>
                  <td>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("ru-RU") : "-"}</td>
                  <td>{new Date(post.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td>
                    <div className="kjar-admin__actions">
                      <Link href={`/admin/posts/${post.slug}/edit`} className="kjar-admin__action-link">
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(post)}
                        className="kjar-admin__action-link kjar-admin__action-link--danger"
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
        onClose={() => setDeleteModal({ isOpen: false, post: null })}
        onConfirm={handleDeleteConfirm}
        title="Удалить пост?"
        message="Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить."
        itemName={deleteModal.post?.title}
        loading={deleting}
      />
    </div>
  );
}
