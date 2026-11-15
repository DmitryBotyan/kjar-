"use client";

import { useId, useRef, useState } from "react";
import ImageCropModal from "./ImageCropModal";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
  disabled?: boolean;
  aspectRatio?: number;
  // false: картинка грузится как есть, без кадрирования
  crop?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  folder = "images",
  label = "Изображение",
  disabled = false,
  aspectRatio = 16 / 9,
  crop = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // На одной форме бывает два загрузчика: id должен быть свой у каждого
  const inputId = useId();

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Требуется авторизация");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload/single?folder=${folder}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка загрузки файла");
      }

      const result = await response.json();
      const imageUrl = result.data.publicUrl || result.data.url;

      setPreview(imageUrl);
      onChange(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки изображения");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Выберите файл изображения");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Размер файла не должен превышать 10MB");
      return;
    }

    setError(null);

    if (!crop) {
      await uploadFile(file);
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    setSelectedFileUrl(fileUrl);
    setShowCropModal(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    const file = new File([croppedImageBlob], "cropped-image.jpg", {
      type: "image/jpeg",
    });

    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
      setSelectedFileUrl(null);
    }

    setShowCropModal(false);
    await uploadFile(file);
  };

  const handleCropCancel = () => {
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
      setSelectedFileUrl(null);
    }
    setShowCropModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const busy = disabled || uploading;

  return (
    <div className="kjar-field">
      <label className="kjar-label" htmlFor={inputId}>
        {label}
      </label>

      {preview && <img className="kjar-upload__preview" src={preview} alt="" />}

      <div className="kjar-upload__actions">
        <input
          ref={fileInputRef}
          className="kjar-sr-only"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={busy}
          id={inputId}
        />
        <label
          htmlFor={inputId}
          className="kjar-button kjar-button--ghost kjar-upload__pick"
          aria-disabled={busy}
        >
          {uploading ? "Загружаем…" : preview ? "Заменить картинку" : "Загрузить картинку"}
        </label>

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="kjar-button kjar-button--danger"
          >
            Убрать картинку
          </button>
        )}
      </div>

      {error && <div className="kjar-admin__error">{error}</div>}

      {showCropModal && selectedFileUrl && (
        <ImageCropModal
          imageSrc={selectedFileUrl}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
          aspectRatio={aspectRatio}
        />
      )}
    </div>
  );
}
