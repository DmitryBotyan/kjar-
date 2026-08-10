"use client";

import { useState, useEffect, useRef } from "react";
import { ImagePlus, Send, X, MessageCircle, Reply } from "lucide-react";
import { HoneypotField, useFormToken } from "./FormGuard";

interface Comment {
  id: number;
  authorName: string;
  content: string;
  image: string | null;
  createdAt: string;
  replies: Comment[];
}

interface CommentsProps {
  targetType: "post" | "event" | "article";
  targetId: number;
}

export default function Comments({ targetType, targetId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Форма
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const { formToken, refresh: refreshFormToken } = useFormToken();

  // Ответ на комментарий
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadComments();
    // Загружаем имя из localStorage
    const savedName = localStorage.getItem("commentAuthorName");
    if (savedName) {
      setAuthorName(savedName);
    }
  }, [targetType, targetId]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/comments/${targetType}/${targetId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем размер (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Изображение слишком большое (максимум 5MB)");
      return;
    }

    // Проверяем тип
    if (!file.type.startsWith("image/")) {
      setError("Можно загружать только изображения");
      return;
    }

    // Показываем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем на сервер
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/comments/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки");
      }

      const data = await response.json();
      setImage(data.data.url || data.data.publicUrl);
    } catch (err) {
      setError("Не удалось загрузить изображение");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authorName.trim()) {
      setError("Укажите ваше имя");
      return;
    }

    if (!content.trim()) {
      setError("Напишите комментарий");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments/${targetType}/${targetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName: authorName.trim(),
          content: content.trim(),
          image,
          parentId: replyTo?.id,
          website,
          formToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка отправки");
      }

      const data = await response.json();
      
      // Сохраняем имя в localStorage
      localStorage.setItem("commentAuthorName", authorName.trim());

      // Добавляем комментарий в список
      if (replyTo) {
        // Добавляем ответ к родительскому комментарию
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...c.replies, data.data] }
              : c
          )
        );
      } else {
        // Добавляем новый корневой комментарий
        setComments((prev) => [data.data, ...prev]);
        setTotal((prev) => prev + 1);
      }

      // Очищаем форму
      setContent("");
      setImage(null);
      setImagePreview(null);
      setReplyTo(null);
      refreshFormToken();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
      refreshFormToken();
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`kjar-comment ${isReply ? "kjar-comment--reply" : ""}`}
    >
      <div className="kjar-comment__header">
        <span className="kjar-comment__author">{comment.authorName}</span>
        <span className="kjar-comment__time">{formatDate(comment.createdAt)}</span>
      </div>
      <p className="kjar-comment__content">{comment.content}</p>
      {comment.image && (
        <div className="kjar-comment__image">
          <img src={comment.image} alt="Изображение" loading="lazy" />
        </div>
      )}
      {!isReply && (
        <button
          type="button"
          className="kjar-comment__reply-btn"
          onClick={() => setReplyTo(comment)}
        >
          <Reply size={14} />
          Ответить
        </button>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="kjar-comment__replies">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="kjar-comments">
      <div className="kjar-comments__header">
        <h3 className="kjar-comments__title">
          <MessageCircle size={20} />
          Комментарии
          {total > 0 && <span className="kjar-comments__count">{total}</span>}
        </h3>
      </div>

      {/* Список комментариев */}
      <div className="kjar-comments__list">
        {loading ? (
          <div className="kjar-comments__loading">Загрузка комментариев...</div>
        ) : comments.length === 0 ? (
          <div className="kjar-comments__empty">
            Комментариев пока нет. Напишите первый в форме ниже.
          </div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>

      {/* Форма комментария */}
      <form className="kjar-comments__form" onSubmit={handleSubmit}>
        {replyTo && (
          <div className="kjar-comments__reply-to">
            <span>Ответ на комментарий от {replyTo.authorName}</span>
            <button type="button" onClick={() => setReplyTo(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {error && <div className="kjar-comments__error">{error}</div>}

        <div className="kjar-comments__form-row">
          <input
            type="text"
            className="kjar-input"
            placeholder="Ваше имя"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="kjar-comments__form-row">
          <textarea
            className="kjar-textarea kjar-comments__textarea"
            placeholder="Напишите комментарий"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={5000}
            rows={3}
          />
        </div>

        {imagePreview && (
          <div className="kjar-comments__image-preview">
            <img src={imagePreview} alt="Превью" />
            <button type="button" onClick={removeImage} disabled={uploading}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="kjar-comments__form-actions">
          <div className="kjar-comments__form-left">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
              id="comment-image"
            />
            <label
              htmlFor="comment-image"
              className="kjar-button kjar-button--ghost kjar-comments__attach-btn"
            >
              <ImagePlus size={18} />
              {uploading ? "Загружаем…" : "Фото"}
            </label>

            <HoneypotField value={website} onChange={setWebsite} />
          </div>

          <button
            type="submit"
            className="kjar-button kjar-button--primary"
            disabled={submitting || uploading}
          >
            <Send size={16} />
            {submitting ? "Публикуем…" : "Опубликовать"}
          </button>
        </div>
      </form>
    </div>
  );
}
