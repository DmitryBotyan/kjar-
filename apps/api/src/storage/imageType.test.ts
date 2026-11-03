import { describe, expect, test } from "bun:test";
import { detectImageType } from "./imageType.js";

const bytes = (...values: number[]) => Buffer.from(values);

describe("detectImageType", () => {
  test("узнаёт JPEG, PNG, GIF и WebP по содержимому", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toEqual({ mime: "image/jpeg", ext: ".jpg" });
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toEqual({ mime: "image/png", ext: ".png" });
    expect(detectImageType(Buffer.from("GIF89a\x01\x00"))).toEqual({ mime: "image/gif", ext: ".gif" });
    expect(detectImageType(Buffer.from("RIFF\x10\x00\x00\x00WEBPVP8 "))).toEqual({ mime: "image/webp", ext: ".webp" });
  });

  test("не принимает SVG, даже если браузер назвал его картинкой", () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(detectImageType(svg)).toBeNull();
  });

  test("не принимает HTML и обрезанные файлы", () => {
    expect(detectImageType(Buffer.from("<!doctype html><script>alert(1)</script>"))).toBeNull();
    expect(detectImageType(bytes(0xff, 0xd8))).toBeNull();
    expect(detectImageType(Buffer.from("RIFF\x10\x00\x00\x00WAVE"))).toBeNull();
  });
});
