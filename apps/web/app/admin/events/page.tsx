"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAdminApi } from "@/lib/admin-api";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; event: any | null }>({
    isOpen: false,
    event: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchFromAdminApi<Array<any>>("/events?limit=100")
      .then((response) => {
        setEvents(response.data || []);
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

  const handleDeleteClick = (event: any) => {
    setDeleteModal({ isOpen: true, event });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.event) return;

    setDeleting(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/posts/${deleteModal.event.slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка удаления ивента");
      }

      setEvents(events.filter((e) => e.id !== deleteModal.event.id));
      setDeleteModal({ isOpen: false, event: null });
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        alert(err instanceof Error ? err.message : "Ошибка удаления ивента");
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
        <h1 className="kjar-admin__title">Управление ивентами</h1>
        <div>
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
          <Link href="/admin/events/new" className="kjar-button kjar-button--primary">
            Добавить ивент
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        {error ? (
          <div className="kjar-admin__empty">
            <p>Ошибка: {error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Ивентов пока нет</p>
            <Link href="/admin/events/new" className="kjar-button kjar-button--primary" style={{ marginTop: "16px" }}>
              Добавить первый ивент
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
                <th>Статус</th>
                <th>Дата</th>
                <th>Создано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.id}</td>
                  <td>{event.title}</td>
                  <td>{event.slug}</td>
                  <td>{event.status || "-"}</td>
                  <td>{event.date ? new Date(event.date).toLocaleDateString("ru-RU") : "-"}</td>
                  <td>{new Date(event.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td>
                    <div className="kjar-admin__actions">
                      <Link href={`/admin/posts/${event.slug}/edit`} className="kjar-admin__action-link">
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(event)}
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
        onClose={() => setDeleteModal({ isOpen: false, event: null })}
        onConfirm={handleDeleteConfirm}
        title="Удалить ивент?"
        message="Вы уверены, что хотите удалить этот ивент? Это действие нельзя отменить."
        itemName={deleteModal.event?.title}
        loading={deleting}
      />
    </div>
  );
}
