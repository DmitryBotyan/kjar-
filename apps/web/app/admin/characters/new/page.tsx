"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";
import CharacterSheetEditor from "@/components/admin/CharacterSheetEditor";
import CharacterCardEditor, { type CharacterCardValue } from "@/components/admin/CharacterCardEditor";
import CharacterSpeciesFields from "@/components/admin/CharacterSpeciesFields";
import MarkdownField from "@/components/admin/MarkdownField";

export default function NewCharacterPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [species, setSpecies] = useState("");
  const [card, setCard] = useState<CharacterCardValue | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      slug: formData.get("slug") || undefined,
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
      statsJson: Object.keys(stats).length > 0 ? stats : null,
      ...card,
    };

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const response = await fetch(`/api/characters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка создания кьяра");
      }

      router.push("/admin/characters");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("UNAUTHORIZED"))) {
        localStorage.removeItem("authToken");
        router.push("/admin");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка создания кьяра");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Создать кьяра</h1>
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

          <CharacterSpeciesFields onSpeciesChange={setSpecies} />

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="field">
              Поле деятельности
            </label>
            <input
              className="kjar-input"
              id="field"
              name="field"
              type="text"
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="startedAt">
              В игре с
            </label>
            <input className="kjar-input" id="startedAt" name="startedAt" type="date" />
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
            />
          </div>

          <MarkdownField
            id="description"
            name="description"
            label="Описание"
            folder="characters"
            rows={12}
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

          <CharacterCardEditor onChange={setCard} />

          <CharacterSheetEditor value={null} species={species} onChange={setStats} />

          <div className="kjar-form-actions">
            <button
              type="submit"
              className="kjar-button kjar-button--primary"
              disabled={saving}
            >
              {saving ? "Создание..." : "Создать кьяра"}
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
