import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler.js";

// Защита публичных форм без внешних сервисов и без картинок с буквами.
// Три независимых проверки: подписанный сервером токен формы, ловушка для
// автозаполнения и минимальное время между открытием формы и отправкой.
// Полностью спам не исключает, но отсекает массовую автоматику; поверх
// работают точечные лимиты запросов.

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET не установлен: без него нельзя подписывать токены форм");
}

// Токен живёт два часа: дольше открытая вкладка обычно уже не отправляется
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
// Человек не заполняет форму быстрее нескольких секунд
const MIN_FILL_MS = 3000;

// Одноразовость: помним использованные токены до их истечения
const usedTokens = new Map<string, number>();

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET!).update(payload).digest("base64url");
}

export function issueFormToken(): string {
  const issuedAt = Date.now().toString(36);
  const nonce = crypto.randomBytes(8).toString("base64url");
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

function verifyFormToken(token: string): { ok: true } | { ok: false; reason: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { ok: false, reason: "Форма устарела, обновите страницу" };
  }

  const [issuedAt, nonce, signature] = parts;
  const expected = sign(`${issuedAt}.${nonce}`);

  // Сравнение постоянного времени: иначе подпись подбирается побайтово
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    return { ok: false, reason: "Форма устарела, обновите страницу" };
  }

  const issued = parseInt(issuedAt, 36);
  if (!Number.isFinite(issued)) {
    return { ok: false, reason: "Форма устарела, обновите страницу" };
  }

  const age = Date.now() - issued;
  if (age > TOKEN_TTL_MS) {
    return { ok: false, reason: "Форма слишком долго была открыта, обновите страницу" };
  }
  if (age < MIN_FILL_MS) {
    return { ok: false, reason: "Слишком быстро. Проверьте текст и отправьте ещё раз" };
  }

  if (usedTokens.has(token)) {
    return { ok: false, reason: "Отправка уже принята, обновите страницу" };
  }
  usedTokens.set(token, issued + TOKEN_TTL_MS);

  return { ok: true };
}

export function antiSpam(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body ?? {};

  // Ловушка: поле спрятано от людей, автозаполнение его заполняет
  const trap = typeof body.website === "string" ? body.website.trim() : "";
  if (trap.length > 0) {
    next(createError("Не удалось отправить форму", 400, "SPAM_DETECTED"));
    return;
  }

  const token = typeof body.formToken === "string" ? body.formToken : "";
  if (!token) {
    next(createError("Форма устарела, обновите страницу", 400, "FORM_TOKEN_MISSING"));
    return;
  }

  const result = verifyFormToken(token);
  if (!result.ok) {
    next(createError(result.reason, 400, "FORM_TOKEN_INVALID"));
    return;
  }

  // Служебные поля дальше не нужны
  delete req.body.website;
  delete req.body.formToken;

  next();
}

// Чистим использованные токены, чтобы карта не росла бесконечно
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of usedTokens) {
    if (now > expiresAt) {
      usedTokens.delete(token);
    }
  }
}, 10 * 60 * 1000).unref();
