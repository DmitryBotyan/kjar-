/**
 * Универсальный прокси-роут для всех запросов к Express API
 * Все запросы выполняются на сервере Next.js, клиент не имеет прямого доступа
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

// В Docker используем имя сервиса 'api', на хосте - localhost
const getApiBaseUrl = () => {
  const cwd = process.cwd();
  const isDocker = cwd.startsWith('/app') || process.env.DOCKER_ENV === 'true';
  
  if (isDocker) {
    return "http://api:3001/api/v1";
  }
  
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  return "http://localhost:3001/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

type RouteContext = {
  params: { path: string[] };
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path, "POST");
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path, "PUT");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path, "DELETE");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path, "PATCH");
}

// Сайт закрыт общим паролем, поэтому и API не отвечает посторонним.
// Серверные компоненты ходят на 127.0.0.1 и проходят без окна пароля,
// админка присылает Bearer, остальным нужен Basic с тем же паролем.
function validBearer(token: string): boolean {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;

  try {
    const body = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    ) as { exp?: number };
    return !body.exp || body.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function isAllowedRequest(request: NextRequest): boolean {
  const password = process.env.SITE_PASSWORD;
  if (!password) return true;

  if (request.headers.get("x-kjar-internal") === password) return true;

  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ") && validBearer(auth.slice(7))) return true;

  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      return decoded.slice(decoded.indexOf(":") + 1) === password;
    } catch {
      return false;
    }
  }

  return false;
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    if (!isAllowedRequest(request)) {
      return NextResponse.json(
        {
          error: {
            code: "SITE_LOCKED",
            message: "Сайт закрыт паролем",
            details: {},
          },
        },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="KJAR", charset="UTF-8"',
          },
        }
      );
    }

    let apiPath = pathSegments.join("/");
    if (apiPath.startsWith("api/v1/")) {
      apiPath = apiPath.substring(7);
    } else if (apiPath.startsWith("api/")) {
      apiPath = apiPath.substring(4);
    }
    apiPath = `/${apiPath}`;
    
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}${apiPath}${queryString ? `?${queryString}` : ""}`;

    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let body: string | ArrayBuffer | undefined;
    if (method !== "GET" && method !== "HEAD") {
      try {
        if (isMultipart) {
          const arrayBuffer = await request.arrayBuffer();
          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            body = arrayBuffer;
          }
        } else {
          const rawBody = await request.text();
          if (rawBody && rawBody.length > 0) {
            body = rawBody;
          }
        }
      } catch (e) {
        console.error("[Proxy] Error reading body:", e);
      }
    }

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "host" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-length" &&
        lowerKey !== "transfer-encoding" &&
        lowerKey !== "content-type"
      ) {
        headers[key] = value;
      }
    });

    if (body) {
      if (isMultipart) {
        // Для multipart сохраняем оригинальный Content-Type с boundary
        headers["Content-Type"] = contentType;
        if (body instanceof ArrayBuffer) {
          headers["Content-Length"] = body.byteLength.toString();
        }
      } else {
        headers["Content-Type"] = "application/json";
        if (typeof body === "string") {
          headers["Content-Length"] = new TextEncoder().encode(body).length.toString();
        }
      }
    }

    let requestBody: BodyInit | undefined;
    if (body instanceof ArrayBuffer) {
      // Конвертируем ArrayBuffer в Uint8Array для совместимости с fetch
      requestBody = new Uint8Array(body);
    } else {
      requestBody = body || undefined;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    });

    const responseText = await response.text();
    let jsonData: unknown;
    
    try {
      jsonData = JSON.parse(responseText);
    } catch {
      jsonData = responseText;
    }

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "connection" &&
        lowerKey !== "content-encoding" &&
        lowerKey !== "transfer-encoding"
      ) {
        responseHeaders.set(key, value);
      }
    });

    return NextResponse.json(jsonData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Proxy] Error:", error);
    return NextResponse.json(
      {
        error: {
          code: "PROXY_ERROR",
          message: "Сервер не ответил, попробуйте ещё раз",
          details: {},
        },
      },
      { status: 500 }
    );
  }
}
