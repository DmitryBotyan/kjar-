"use client";

import { useState } from "react";
import { HoneypotField, useFormToken } from "../../components/FormGuard";

const REQUEST_TYPES = [
  { value: "Вопрос", label: "Вопрос" },
  { value: "Заявка на роль", label: "Заявка на роль" },
  { value: "Предложение по лору", label: "Предложение по лору" },
  { value: "Поддержка", label: "Поддержка" }
];

export function ContactForm() {
  const { formToken, refresh } = useFormToken();
  const [website, setWebsite] = useState("");
  const [type, setType] = useState(REQUEST_TYPES[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

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
          subject: `${type}: ${String(values.get("subject") || "")}`,
          message: String(values.get("message") || ""),
          website,
          formToken
        })
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error?.message || "Не удалось отправить обращение");
      }

      form.reset();
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
          Редакция читает обращения в порядке поступления и отвечает по указанному
          контакту в течение 1–3 рабочих дней.
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
            placeholder="Почта или ник в мессенджере"
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
            {REQUEST_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
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

      <HoneypotField value={website} onChange={setWebsite} />

      {error ? (
        <p className="kjar-comments__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="kjar-form-actions">
        <button className="kjar-button kjar-button--primary" type="submit" disabled={submitting}>
          {submitting ? "Отправляем" : "Отправить письмо"}
        </button>
        <button className="kjar-button kjar-button--ghost" type="reset" disabled={submitting}>
          Очистить
        </button>
      </div>

      <p className="kjar-form-note">Ответим по указанному контакту в течение 1–3 рабочих дней.</p>
    </form>
  );
}
