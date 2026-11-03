export interface ImageType {
  mime: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  ext: ".jpg" | ".png" | ".gif" | ".webp";
}

// Тип берём из первых байтов файла, а не из имени и Content-Type: их задаёт
// загружающий. Файлы отдаются с нашего домена, и SVG или HTML со скриптом
// выполнился бы в контексте kjar.ru, где в localStorage лежит токен входа
export function detectImageType(buffer: Buffer): ImageType | null {
  const startsWith = (signature: number[] | string, offset = 0) => {
    const expected = typeof signature === "string" ? Buffer.from(signature, "ascii") : Buffer.from(signature);
    return buffer.length >= offset + expected.length && buffer.subarray(offset, offset + expected.length).equals(expected);
  };

  if (startsWith([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: ".jpg" };
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: ".png" };
  if (startsWith("GIF87a") || startsWith("GIF89a")) return { mime: "image/gif", ext: ".gif" };
  if (startsWith("RIFF") && startsWith("WEBP", 8)) return { mime: "image/webp", ext: ".webp" };
  return null;
}
