import { describe, expect, test } from "bun:test";
import { capitalizeFirst } from "./capitalize.js";

describe("capitalizeFirst", () => {
  test("поднимает первую букву и не трогает остальные", () => {
    expect(capitalizeFirst("базы кьяров")).toBe("Базы кьяров");
    expect(capitalizeFirst("ёлка НПС")).toBe("Ёлка НПС");
  });

  test("обрезает пробелы по краям", () => {
    expect(capitalizeFirst("  карта ")).toBe("Карта");
  });

  test("оставляет пустую строку и уже заглавные подписи", () => {
    expect(capitalizeFirst("")).toBe("");
    expect(capitalizeFirst("Лорные")).toBe("Лорные");
  });
});
