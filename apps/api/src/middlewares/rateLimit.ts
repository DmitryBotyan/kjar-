import type { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Значения по умолчанию можно переопределить через .env
// (в dev страницы делают по несколько запросов, 100/15мин выбирается быстро)
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 100;

function getClientId(req: Request): string {
  // req.ip разворачивается в реальный адрес посетителя благодаря trust proxy
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userId = (req as any).user?.id;
  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Серверные компоненты Next дергают API изнутри docker-сети, чтобы собрать
 * страницу. Такие запросы нельзя считать за посетителя: одна страница делает
 * их несколько, и общий лимит выбирался бы за пару десятков просмотров.
 * Отличаем по отсутствию X-Forwarded-For — его проставляет nginx на входе,
 * а порт API наружу не выставлен, подделать заголовок снаружи нельзя.
 * Следствие: в dev-стенде без nginx лимиты не применяются, проверять их
 * нужно запросами напрямую к API либо на боевом.
 */
function isInternalRequest(req: Request): boolean {
  return !req.headers["x-forwarded-for"];
}

export function rateLimit(
  maxRequests: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS,
  bucket: string = "global"
) {
  // У каждого лимитера свой счётчик: точечный лимит на вход не должен
  // расходовать общий лимит и наоборот
  return (req: Request, res: Response, next: NextFunction): void => {
    if (isInternalRequest(req)) {
      next();
      return;
    }

    const clientId = `${bucket}:${getClientId(req)}`;
    const now = Date.now();
    const record = store[clientId];

    // Очистка старых записей (простая реализация, в продакшене использовать Redis)
    if (record && now > record.resetTime) {
      delete store[clientId];
    }

    const current = store[clientId];

    if (!current) {
      // Первый запрос
      store[clientId] = {
        count: 1,
        resetTime: now + windowMs
      };
      next();
      return;
    }

    if (current.count >= maxRequests) {
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Превышен лимит запросов. Попробуйте позже.",
          details: {
            resetTime: new Date(current.resetTime).toISOString()
          }
        }
      });
      return;
    }

    current.count++;
    next();
  };
}

// Очистка старых записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of Object.entries(store)) {
    if (now > record.resetTime) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);
