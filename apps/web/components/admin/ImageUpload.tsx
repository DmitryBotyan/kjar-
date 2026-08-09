"use client";

import { useState, useRef } from "react";
import ImageCropModal from "./ImageCropModal";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
  disabled?: boolean;
  aspectRatio?: number;
}

export default function ImageUpload({
  value,
  onChange,
  folder = "images",
  label = "Изображение",
  disabled = false,
  aspectRatio = 16 / 9,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      setError("Выберите файл изображения");
      return;
    }

    // Проверка размера (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Размер файла не должен превышать 10MB");
      return;
    }

    setError(null);

    // Создаем URL для предпросмотра и показываем модальное окно кадрирования
    const fileUrl = URL.createObjectURL(file);
    setSelectedFileUrl(fileUrl);
    setShowCropModal(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    // Создаем File из Blob для загрузки
    const file = new File([croppedImageBlob], "cropped-image.jpg", {
      type: "image/jpeg",
    });

    // Освобождаем URL объекта
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

  return (
    <div className="kjar-field">
      <label className="kjar-label">{label}</label>
      
      {preview && (
        <div style={{ marginBottom: "12px" }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          style={{ display: "none" }}
          id="image-upload-input"
        />
        <label
          htmlFor="image-upload-input"
          className="kjar-button kjar-button--ghost"
          style={{
            cursor: disabled || uploading ? "not-allowed" : "pointer",
            opacity: disabled || uploading ? 0.6 : 1,
          }}
        >
          {uploading ? "Загрузка..." : preview ? "Заменить изображение" : "Загрузить изображение"}
        </label>
        
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="kjar-button kjar-button--ghost"
            style={{
              color: "#d32f2f",
            }}
          >
            Удалить
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: "8px", color: "#d32f2f", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {preview && (
        <input
          type="hidden"
          name="image"
          value={preview}
        />
      )}

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
