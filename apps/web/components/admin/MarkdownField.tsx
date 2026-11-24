"use client";

import { useRef, useState } from "react";

type MarkdownFieldProps = {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  folder?: string;
  note?: string;
};

/**
 * Поле для статьи или поста: панель вставки и загрузка картинки прямо в текст.
 * Разметка остаётся обычным Markdown, поэтому текст можно править и вручную.
 */
export default function MarkdownField({
  id,
  name,
  label,
  defaultValue,
  value: controlledValue,
  onChange,
  rows = 12,
  folder = "articles",
  note
}: MarkdownFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = controlledValue ?? internalValue;
  const setValue = (next: string) => {
    if (controlledValue === undefined) setInternalValue(next);
    onChange?.(next);
  };

  const replaceSelection = (before: string, after = before, placeholder = "") => {
    const textarea = ref.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    setValue(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const applyList = (kind: "number" | "bullet") => {
    const textarea = ref.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndIndex = value.indexOf("\n", end);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");

    if (block.trim() === "") {
      const marker = kind === "number" ? "1. " : "- ";
      const next = value.slice(0, start) + marker + value.slice(end);
      setValue(next);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marker.length, start + marker.length);
      });
      return;
    }

    let counter = 0;
    const nextBlock = lines
      .map((line) => {
        if (line.trim() === "") return line;
        counter += 1;
        const clean = line.replace(/^\s*(?:\d+(?:\.\d+)*[.)]|[-*+•·])\s+/, "");
        return `${kind === "number" ? `${counter}. ` : "- "}${clean}`;
      })
      .join("\n");

    const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + nextBlock.length);
    });
  };

  const addHeading = (level: 2 | 3) => {
    const textarea = ref.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const mark = `${"#".repeat(level)} `;
    const next = value.slice(0, lineStart) + mark + value.slice(lineStart);
    setValue(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + mark.length, start + mark.length);
    });
  };

  const insertText = (text: string) => {
    const textarea = ref.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const next = value.slice(0, start) + text + value.slice(start);
    setValue(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const uploadImage = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Требуется авторизация");

      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`/api/upload/single?folder=${folder}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Ошибка загрузки картинки");
      }

      const result = await response.json();
      const url = result.data.publicUrl || result.data.url;
      insertText(`\n\n![${file.name.replace(/\.[^.]+$/, "")}](${url})\n\n`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки картинки");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="kjar-field">
      <label className="kjar-label" htmlFor={id}>
        {label}
      </label>

      <div className="kjar-md-toolbar" role="toolbar" aria-label="Разметка текста">
        <button type="button" onClick={() => replaceSelection("**", "**", "жирный")}>
          Ж
        </button>
        <button type="button" onClick={() => replaceSelection("*", "*", "курсив")}>
          К
        </button>
        <button type="button" onClick={() => replaceSelection("++", "++", "подчёркнутый")}>
          Подчёркнутый
        </button>
        <button type="button" onClick={() => replaceSelection("==", "==", "выделенный")}>
          Выделить
        </button>
        <button type="button" onClick={() => addHeading(2)}>
          H2
        </button>
        <button type="button" onClick={() => addHeading(3)}>
          H3
        </button>
        <button
          type="button"
          title="Нумерованный список"
          aria-label="Нумерованный список"
          onClick={() => applyList("number")}
        >
          1.
        </button>
        <button
          type="button"
          title="Список с маркерами"
          aria-label="Список с маркерами"
          onClick={() => applyList("bullet")}
        >
          •
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Загрузка…" : "Вставить фото"}
        </button>
        <input
          ref={fileRef}
          className="kjar-sr-only"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadImage(file);
          }}
        />
      </div>

      <textarea
        ref={ref}
        className="kjar-textarea kjar-textarea--prose"
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      <p className="kjar-admin__note">
        {note ||
          "Новая строка сохраняется как есть. Пустая строка начинает новый абзац с красной строки. Подчёркивание: ++текст++, выделение: ==текст==."}
      </p>
      {error && <div className="kjar-admin__error">{error}</div>}
    </div>
  );
}