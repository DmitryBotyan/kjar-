"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { HoneypotField, useFormToken } from "../../components/FormGuard";
import type { DictionaryEntry } from "@/lib/dictionaries";

type ContactFormProps = {
  requestTypes: DictionaryEntry[];
};

export function ContactForm({ requestTypes }: ContactFormProps) {
  const { formToken, refresh } = useFormToken();
  const [website, setWebsite] = useState("");
  const [type, setType] = useState(requestTypes[0]?.code || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Картинки идут через ту же гостевую загрузку, что и в комментариях
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Картинка больше 10 МБ");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/comments/upload", { method: "POST", body: formData });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || "Не удалось загрузить картинку");
      const url = body?.data?.url || body?.data?.publicUrl;
      if (url) setImages((current) => [...current, url]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить картинку");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(values.get("name") || ""),
          contact: String(values.get("contact") || ""),
          requestType: type || null,
          subject: String(values.get("subject") || ""),
          message: String(values.get("message") || ""),
          attachments: String(values.get("attachments") || "") || null,
          images,
          website,
          formToken
        })
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error?.message || "Не удалось отправить обращение");
      }

      form.reset();
      setImages([]);
      setSent(true);
      refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить обращение");
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="kjar-form-card">
        <h2 className="kjar-contacts__form-title">Обращение отправлено</h2>
        <p className="kjar-contacts__text">
          Обращения читаем в порядке поступления и отвечаем по указанному
          контакту в течение 1–5 рабочих дней.
        </p>
        <div className="kjar-form-actions">
          <button
            className="kjar-button kjar-button--ghost"
            type="button"
            onClick={() => setSent(false)}
          >
            Написать ещё
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="kjar-form-card" onSubmit={handleSubmit}>
      <h2 className="kjar-contacts__form-title">Форма обращения</h2>

      <div className="kjar-form-grid">
        <div className="kjar-field">
          <label className="kjar-label" htmlFor="contact-name">
            Имя
          </label>
          <input
            className="kjar-input"
            id="contact-name"
            name="name"
            type="text"
            placeholder="Как к вам обращаться"
            maxLength={200}
            required
          />
        </div>

        <div className="kjar-field">
          <label className="kjar-label" htmlFor="contact-channel">
            Способ связи
          </label>
          <input
            className="kjar-input"
            id="contact-channel"
            name="contact"
            type="text"
            placeholder="Почта или ссылка на ВК/ТГ"
            maxLength={200}
            required
          />
        </div>
      </div>

      <div className="kjar-form-grid">
        <div className="kjar-field">
          <label className="kjar-label" htmlFor="contact-topic">
            Тема
          </label>
          <input
            className="kjar-input"
            id="contact-topic"
            name="subject"
            type="text"
            placeholder="Коротко о сути"
            maxLength={200}
            required
          />
        </div>

        <div className="kjar-field">
          <label className="kjar-label" htmlFor="contact-type">
            Тип обращения
          </label>
          <select
            className="kjar-select"
            id="contact-type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {requestTypes.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="contact-message">
          Сообщение
        </label>
        <textarea
          className="kjar-textarea"
          id="contact-message"
          name="message"
          rows={7}
          placeholder="Опишите детали, приложите ссылки или контекст."
          maxLength={10000}
          required
        />
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="contact-attachments">
          Приложения
        </label>
        <textarea
          className="kjar-textarea"
          id="contact-attachments"
          name="attachments"
          rows={3}
          placeholder="Ссылки на работы, анкеты и посты, по одной в строке"
          maxLength={2000}
        />
        {images.length > 0 && (
          <ul className="kjar-attachments">
            {images.map((url) => (
              <li className="kjar-comments__image-preview" key={url}>
                <img src={url} alt="Приложенная картинка" />
                <button
                  type="button"
                  aria-label="Убрать картинку"
                  onClick={() => setImages((current) => current.filter((item) => item !== url))}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {images.length < 5 && (
          <div>
            <input
              ref={fileInputRef}
              className="kjar-sr-only"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              id="contact-image"
              onChange={handleImageSelect}
            />
            <label
              htmlFor="contact-image"
              className="kjar-button kjar-button--ghost kjar-comments__attach-btn"
            >
              <ImagePlus size={18} aria-hidden="true" />
              {uploading ? "Загружаем…" : "Приложить фото"}
            </label>
          </div>
        )}
      </div>

      <HoneypotField value={website} onChange={setWebsite} />

      {error ? (
        <p className="kjar-comments__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="kjar-form-actions">
        <button className="kjar-button kjar-button--primary" type="submit" disabled={submitting || uploading}>
          {submitting ? "Отправляем" : "Отправить письмо"}
        </button>
        <button className="kjar-button kjar-button--ghost" type="reset" disabled={submitting}>
          Очистить
        </button>
      </div>

      <p className="kjar-form-note">Ответим по указанному контакту в течение 1–5 рабочих дней.</p>
    </form>
  );
}
