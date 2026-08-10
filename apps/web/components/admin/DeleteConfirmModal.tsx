"use client";

import { useEffect } from "react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="kjar-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="kjar-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2>{title}</h2>
        <p className="kjar-modal__text">
          {message}
          {itemName && <strong className="kjar-modal__item">{itemName}</strong>}
        </p>
        <div className="kjar-modal__actions">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="kjar-button kjar-button--ghost"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="kjar-button kjar-button--danger"
          >
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}
