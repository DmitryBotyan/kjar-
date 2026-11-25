"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Code2,
  Eraser,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { UnderlinePlus } from "./editor/UnderlinePlus";
import { MarkedParagraph } from "./editor/MarkedParagraph";
import {
  composeRedline,
  splitRedline,
  withLists,
  withMarkedLines,
} from "@/lib/markdown";

export type RichTextEditorProps = {
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
 * Редактор для всех разделов админки: текст, разметка и картинки
 * правятся прямо в документе, а форма получает обычный Markdown.
 */
export function RichTextEditor({
  id,
  name,
  label,
  defaultValue,
  value: controlledValue,
  onChange,
  rows = 8,
  folder = "articles",
  note = "Пустая строка начинает новый абзац. Красная строка включается кнопкой с пилкроу.",
}: RichTextEditorProps) {
  const initial = splitRedline(controlledValue ?? defaultValue ?? "");
  const preparedBody = withMarkedLines(withLists(initial.body));
  const [redline, setRedline] = useState(initial.redline);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(preparedBody);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const redlineRef = useRef(redline);
  const lastEmitted = useRef<string | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncing = useRef(false);
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  redlineRef.current = redline;

  const flush = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !sourceRef.current) return;
    const markdown = composeRedline(redlineRef.current, editor.getMarkdown());
    sourceRef.current.value = markdown;
    lastEmitted.current = markdown;
    onChange?.(markdown);
  }, [onChange]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      flush();
    }, 250);
  }, [flush]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
        codeBlock: false,
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { class: "kjar-md-editor__link" },
        },
      }),
      UnderlinePlus,
      Highlight,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "Начните писать текст…" }),
      Markdown,
      MarkedParagraph,
    ],
    content: preparedBody,
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "kjar-md-editor__content",
        "aria-label": label,
      },
    },
    onUpdate: () => {
      if (syncing.current) return;
      scheduleFlush();
    },
    onBlur: () => {
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
      flush();
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, []);

  useEffect(() => {
    const form = sourceRef.current?.closest("form");
    if (!form) return;
    const handleSubmit = () => {
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
      flush();
    };
    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [flush]);

  useEffect(() => {
    if (!editor || controlledValue === undefined) return;
    if (lastEmitted.current === controlledValue) return;
    const next = splitRedline(controlledValue);
    const prepared = withMarkedLines(withLists(next.body));
    setRedline(next.redline);
    setSourceValue(prepared);
    syncing.current = true;
    editor.commands.setContent(prepared, { contentType: "markdown" });
    syncing.current = false;
    lastEmitted.current = controlledValue;
  }, [editor, controlledValue]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      underline: current?.isActive("underline") ?? false,
      highlight: current?.isActive("highlight") ?? false,
      h2: current?.isActive("heading", { level: 2 }) ?? false,
      h3: current?.isActive("heading", { level: 3 }) ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
      blockquote: current?.isActive("blockquote") ?? false,
      link: current?.isActive("link") ?? false,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
    }),
  });

  const toggleRedline = () => {
    const next = !redline;
    setRedline(next);
    redlineRef.current = next;
    requestAnimationFrame(flush);
  };

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Адрес ссылки", previous || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const uploadImage = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Требуется авторизация");
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/upload/single?folder=${encodeURIComponent(folder)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || "Не удалось загрузить картинку");
      }
      const result = await response.json();
      const url = result.data?.publicUrl || result.data?.url;
      if (!url) throw new Error("Сервер не вернул адрес картинки");
      editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить картинку");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openSource = () => {
    setSourceValue(composeRedline(redline, editor?.getMarkdown() ?? ""));
    setSourceMode(true);
  };

  const closeSource = () => {
    const next = splitRedline(sourceValue);
    const prepared = withMarkedLines(withLists(next.body));
    setRedline(next.redline);
    redlineRef.current = next.redline;
    syncing.current = true;
    editor?.commands.setContent(prepared, { contentType: "markdown" });
    syncing.current = false;
    setSourceMode(false);
    requestAnimationFrame(flush);
  };

  const toolbarButton = (
    title: string,
    pressed: boolean | undefined,
    onClick: () => void,
    icon: React.ReactNode,
    disabled = false,
  ) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {icon}
    </button>
  );

  return (
    <div className="kjar-field">
      <div className="kjar-md-editor__head">
        <label className="kjar-label" htmlFor={id}>
          {label}
        </label>
        <button
          type="button"
          className="kjar-md-editor__source-toggle"
          onClick={sourceMode ? closeSource : openSource}
        >
          <Code2 size={14} aria-hidden="true" />
          {sourceMode ? "Редактор" : "Markdown"}
        </button>
      </div>

      <div className={`kjar-md-editor${redline ? " kjar-md-editor--redline" : ""}`}>
        {sourceMode ? (
          <textarea
            className="kjar-md-editor__source"
            rows={rows}
            value={sourceValue}
            onChange={(event) => setSourceValue(event.target.value)}
            spellCheck={false}
          />
        ) : (
          <>
            <div className="kjar-md-editor__toolbar" role="toolbar" aria-label="Форматирование">
              {toolbarButton("Жирный", state?.bold, () => editor?.chain().focus().toggleBold().run(), <Bold size={16} />)}
              {toolbarButton("Курсив", state?.italic, () => editor?.chain().focus().toggleItalic().run(), <Italic size={16} />)}
              {toolbarButton("Подчёркнутый", state?.underline, () => editor?.chain().focus().toggleUnderline().run(), <UnderlineIcon size={16} />)}
              {toolbarButton("Выделение", state?.highlight, () => editor?.chain().focus().toggleHighlight().run(), <Highlighter size={16} />)}
              <span className="kjar-md-editor__divider" aria-hidden="true" />
              {toolbarButton("Заголовок 2", state?.h2, () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={16} />)}
              {toolbarButton("Заголовок 3", state?.h3, () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 size={16} />)}
              <span className="kjar-md-editor__divider" aria-hidden="true" />
              {toolbarButton("Маркированный список", state?.bulletList, () => editor?.chain().focus().toggleBulletList().run(), <List size={16} />)}
              {toolbarButton("Нумерованный список", state?.orderedList, () => editor?.chain().focus().toggleOrderedList().run(), <ListOrdered size={16} />)}
              {toolbarButton("Цитата", state?.blockquote, () => editor?.chain().focus().toggleBlockquote().run(), <Quote size={16} />)}
              <span className="kjar-md-editor__divider" aria-hidden="true" />
              {toolbarButton("Ссылка", state?.link, setLink, <Link2 size={16} />)}
              {toolbarButton("Картинка", false, () => fileRef.current?.click(), <ImagePlus size={16} />)}
              {toolbarButton("Красная строка", redline, toggleRedline, <Pilcrow size={16} />)}
              {toolbarButton("Убрать форматирование", false, () => editor?.chain().focus().unsetAllMarks().clearNodes().run(), <Eraser size={16} />)}
              <span className="kjar-md-editor__divider" aria-hidden="true" />
              {toolbarButton("Отменить", false, () => editor?.chain().focus().undo().run(), <Undo2 size={16} />, !state?.canUndo)}
              {toolbarButton("Повторить", false, () => editor?.chain().focus().redo().run(), <Redo2 size={16} />, !state?.canRedo)}
            </div>

            <div className="kjar-md-editor__body" style={{ minHeight: `${rows * 1.6}em` }}>
              <EditorContent editor={editor} />
            </div>

            {uploading ? <p className="kjar-md-editor__hint">Загружаю картинку…</p> : null}
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadImage(file);
        }}
      />

      <textarea
        ref={sourceRef}
        id={id}
        name={name}
        defaultValue={composeRedline(initial.redline, initial.body)}
        hidden
        readOnly
      />

      {error ? <p className="kjar-md-editor__error">{error}</p> : null}
      <p className="kjar-field__note">{note}</p>
    </div>
  );
}
