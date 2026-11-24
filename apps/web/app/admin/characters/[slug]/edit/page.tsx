"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchFromAdminApi } from "@/lib/admin-api";
import ImageUpload from "@/components/admin/ImageUpload";
import CharacterSheetEditor from "@/components/admin/CharacterSheetEditor";
import CharacterCardEditor, { type CharacterCardValue } from "@/components/admin/CharacterCardEditor";
import CharacterSpeciesFields from "@/components/admin/CharacterSpeciesFields";
import MarkdownField from "@/components/admin/MarkdownField";
import { statsObject } from "@/lib/character";
import type { Character } from "@/lib/types";

export default function EditCharacterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [species, setSpecies] = useState("");
  const [card, setCard] = useState<CharacterCardValue | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchFromAdminApi<Character>(`/characters/${slug}`)
      .then((response) => {
        setCharacter(response.data);
        setSpecies(response.data.species || "");
        setImageUrl(response.data.image || null);
        setPortraitUrl(response.data.portrait || null);
        setStats(
          statsObject(response.data.statsJson)
        );
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
      role: formData.get("role"),
      subtype: formData.get("subtype") || null,
      field: formData.get("field") || null,
      species: formData.get("species") || null,
      summary: formData.get("summary") || null,
      description: formData.get("description") || null,
      startedAt: formData.get("startedAt")
        ? new Date(String(formData.get("startedAt"))).toISOString()
        : null,
      image: imageUrl,
      portrait: portraitUrl,
      statsJson: stats && Object.keys(stats).length > 0 ? stats : null,
      ...card,
    };

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/characters/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка обновления кьяра");
      }

      router.push("/admin/characters");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка обновления кьяра");
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

  if (!character) {
    return (
      <div className="kjar-admin">
        <div className="kjar-admin__empty">
          <p>Кьяр не найден</p>
          <Link href="/admin/characters" className="kjar-button kjar-button--primary">
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Редактировать кьяра</h1>
        <Link href="/admin/characters" className="kjar-button kjar-button--ghost">
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
              Имя *
            </label>
            <input
              className="kjar-input"
              id="name"
              name="name"
              type="text"
              required
              defaultValue={character.name}
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
              defaultValue={character.slug}
            />
          </div>

          <CharacterSpeciesFields
            defaultSpecies={character.species}
            defaultType={character.role}
            defaultSubtype={character.subtype}
            onSpeciesChange={setSpecies}
          />

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="field">
              Поле деятельности
            </label>
            <input
              className="kjar-input"
              id="field"
              name="field"
              type="text"
              defaultValue={character.field || ""}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="startedAt">
              В игре с
            </label>
            <input
              className="kjar-input"
              id="startedAt"
              name="startedAt"
              type="date"
              defaultValue={
                character.startedAt
                  ? new Date(character.startedAt).toISOString().slice(0, 10)
                  : ""
              }
            />
            <p className="kjar-admin__note">
              Пусто: дата берётся из дня создания карточки. Дата обновления
              проставляется сама при сохранении.
            </p>
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
              defaultValue={character.summary || ""}
            />
          </div>

          <MarkdownField
            id="description"
            name="description"
            label="Описание"
            folder="characters"
            rows={12}
            defaultValue={character.description}
            note="Новая строка сохраняется как есть. Пустая строка начинает новый абзац."
          />

          <ImageUpload
            value={imageUrl || undefined}
            onChange={setImageUrl}
            folder="characters"
            label="Картинка страницы кьяра"
            crop={false}
          />

          <ImageUpload
            value={portraitUrl || undefined}
            onChange={setPortraitUrl}
            folder="characters"
            label="Вертикальный портрет для колоды"
            aspectRatio={3 / 4}
          />

          <CharacterCardEditor initial={character} onChange={setCard} />

          <CharacterSheetEditor
            value={statsObject(character.statsJson)}
            species={species}
            onChange={setStats}
          />

          <div className="kjar-form-actions">
            <button
              type="submit"
              className="kjar-button kjar-button--primary"
              disabled={saving}
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </button>
            <Link href="/admin/characters" className="kjar-button kjar-button--ghost">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
