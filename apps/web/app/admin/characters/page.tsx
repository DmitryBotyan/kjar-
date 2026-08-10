"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAdminApi } from "@/lib/admin-api";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function AdminCharactersPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; character: any | null }>({
    isOpen: false,
    character: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchFromAdminApi<Array<any>>("/characters?limit=100")
      .then((response) => {
        setCharacters(response.data || []);
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

  const handleDeleteClick = (character: any) => {
    setDeleteModal({ isOpen: true, character });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.character) return;

    setDeleting(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/characters/${deleteModal.character.slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка удаления персонажа");
      }

      setCharacters(characters.filter((c) => c.id !== deleteModal.character.id));
      setDeleteModal({ isOpen: false, character: null });
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        alert(err instanceof Error ? err.message : "Ошибка удаления персонажа");
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
        <h1 className="kjar-admin__title">Управление персонажами</h1>
        <div>
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
          <Link href="/admin/characters/new" className="kjar-button kjar-button--primary">
            Добавить персонажа
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        {error ? (
          <div className="kjar-admin__empty">
            <p>Ошибка: {error}</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Персонажей пока нет</p>
            <Link href="/admin/characters/new" className="kjar-button kjar-button--primary">
              Добавить первого персонажа
            </Link>
          </div>
        ) : (
          <div className="kjar-admin__table-wrap">
          <table className="kjar-admin__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Slug</th>
                <th>Роль</th>
                <th>Вид</th>
                <th>Статус</th>
                <th>Создано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character) => (
                <tr key={character.id}>
                  <td>{character.id}</td>
                  <td>{character.name}</td>
                  <td>{character.slug}</td>
                  <td>{character.role || "-"}</td>
                  <td>{character.species || "-"}</td>
                  <td>{character.status || "-"}</td>
                  <td>{new Date(character.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td>
                    <div className="kjar-admin__actions">
                      <Link href={`/admin/characters/${character.slug}/edit`} className="kjar-admin__action-link">
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(character)}
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
        onClose={() => setDeleteModal({ isOpen: false, character: null })}
        onConfirm={handleDeleteConfirm}
        title="Удалить персонажа?"
        message="Вы уверены, что хотите удалить этого персонажа? Это действие нельзя отменить."
        itemName={deleteModal.character?.name}
        loading={deleting}
      />
    </div>
  );
}
