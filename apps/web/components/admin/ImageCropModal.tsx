"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspectRatio?: number;
}

export default function ImageCropModal({
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 16 / 9,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Устанавливаем размер canvas равным размеру обрезанной области
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Рисуем обрезанную часть изображения на canvas
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.95
      );
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          position: "relative",
          width: "90%",
          maxWidth: "800px",
          height: "80vh",
          maxHeight: "600px",
          backgroundColor: "var(--peat)",
          borderRadius: "8px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            minHeight: "400px",
            flex: 1,
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                position: "relative",
              },
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "16px",
            borderTop: "1px solid var(--line, #333)",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1 }}>
            <label
              style={{
                fontSize: "14px",
                color: "var(--text, #fff)",
                minWidth: "60px",
              }}
            >
              Масштаб:
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{
                flex: 1,
                maxWidth: "200px",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                color: "var(--muted, #999)",
                minWidth: "40px",
                textAlign: "right",
              }}
            >
              {zoom.toFixed(1)}x
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="kjar-button kjar-button--ghost"
              style={{
                padding: "8px 16px",
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="kjar-button"
              style={{
                padding: "8px 16px",
              }}
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
