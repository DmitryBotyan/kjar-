"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { HoneypotField, useFormToken } from "./FormGuard";

type Work = {
  id: number;
  authorName: string;
  title: string | null;
  image: string;
};

type CharacterWorksProps = {
  slug: string;
  name: string;
  works: Work[];
};

export default function CharacterWorks({ slug, name, works }: CharacterWorksProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [website, setWebsite] = useState("");
  const { formToken, refresh } = useFormToken();
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Файл больше 10 МБ");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/characters/works/upload", { method: "POST", body });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error?.message || "Не удалось загрузить картинку");
      setImage(data.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить картинку");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authorName.trim()) return setError("Укажите ваше имя");
    if (!image) return setError("Добавьте картинку");

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/characters/${slug}/works`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim(),
          title: title.trim() || null,
          image,
          website,
          formToken
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error?.message || "Не удалось отправить работу");

      setSent(true);
      setTitle("");
      clearFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить работу");
    } finally {
      setSubmitting(false);
      refresh();
    }
  };

  return (
    <section className="kjar-character__section kjar-works" aria-labelledby="kjar-works-title">
      <div className="kjar-works__head">
        <h2 className="kjar-section__title" id="kjar-works-title">
          Работы кьяра
        </h2>
        {!formOpen && (
          <button
            type="button"
            className="kjar-button kjar-button--ghost"
            onClick={() => {
              setFormOpen(true);
              setSent(false);
            }}
          >
            Прислать работу
          </button>
        )}
      </div>

      {works.length > 0 ? (
        <ul className="kjar-works__grid">
          {works.map((work) => (
            <li className="kjar-works__item" key={work.id}>
              <a href={work.image} target="_blank" rel="noreferrer" className="kjar-works__image">
                <img src={work.image} alt={work.title || `Работа по ${name}`} loading="lazy" />
              </a>
              <p className="kjar-works__caption">
                {work.title && <span className="kjar-works__title">{work.title}</span>}
                <span className="kjar-works__author">{work.authorName}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="kjar-section__note">
          Здесь появятся арты игроков по {name}. Нарисовали — присылайте.
        </p>
      )}

      {formOpen && (
        <form className="kjar-works__form" onSubmit={submit}>
          {sent && (
            <p className="kjar-works__notice">
              Работа отправлена. Она появится здесь, когда её одобрит редакция.
            </p>
          )}
          {error && <p className="kjar-works__error">{error}</p>}

          <HoneypotField value={website} onChange={setWebsite} />

          <div className="kjar-works__fields">
            <div className="kjar-field">
              <label className="kjar-label" htmlFor="work-author">
                Ваше имя
              </label>
              <input
                className="kjar-input"
                id="work-author"
                value={authorName}
                maxLength={100}
                onChange={(event) => setAuthorName(event.target.value)}
                required
              />
            </div>
            <div className="kjar-field">
              <label className="kjar-label" htmlFor="work-title">
                Название, если есть
              </label>
              <input
                className="kjar-input"
                id="work-title"
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
          </div>

          <div className="kjar-works__file">
            {preview ? (
              <div className="kjar-works__preview">
                <img src={preview} alt="" />
                <button
                  type="button"
                  onClick={clearFile}
                  disabled={uploading}
                  aria-label="Убрать картинку"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="kjar-button kjar-button--ghost kjar-works__pick">
                <ImagePlus aria-hidden="true" />
                Выбрать картинку
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="kjar-sr-only"
                  onChange={(event) => pickFile(event.target.files?.[0])}
                />
              </label>
            )}
            <span className="kjar-section__note">JPG, PNG, GIF или WebP до 10 МБ</span>
          </div>

          <div className="kjar-form-actions">
            <button
              type="submit"
              className="kjar-button kjar-button--primary"
              disabled={submitting || uploading || !formToken}
            >
              {uploading ? "Загружаем…" : submitting ? "Отправляем…" : "Отправить"}
            </button>
            <button
              type="button"
              className="kjar-button kjar-button--ghost"
              onClick={() => setFormOpen(false)}
            >
              Отмена
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
