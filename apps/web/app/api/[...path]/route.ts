/**
 * Универсальный прокси-роут для всех запросов к Express API
 * Все запросы выполняются на сервере Next.js, клиент не имеет прямого доступа
 */

import { NextRequest, NextResponse } from "next/server";

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

// Next.js 14 - params не Promise
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

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Собираем путь к API
    let apiPath = pathSegments.join("/");
    if (apiPath.startsWith("api/v1/")) {
      apiPath = apiPath.substring(7);
    } else if (apiPath.startsWith("api/")) {
      apiPath = apiPath.substring(4);
    }
    apiPath = `/${apiPath}`;
    
    // Получаем query параметры
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}${apiPath}${queryString ? `?${queryString}` : ""}`;

    // Получаем Content-Type исходного запроса
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    // Получаем тело запроса
    let body: string | ArrayBuffer | undefined;
    if (method !== "GET" && method !== "HEAD") {
      try {
        if (isMultipart) {
          // Для multipart/form-data читаем как ArrayBuffer
          const arrayBuffer = await request.arrayBuffer();
          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            body = arrayBuffer;
          }
        } else {
          // Для остальных типов читаем как текст
          const rawBody = await request.text();
          if (rawBody && rawBody.length > 0) {
            body = rawBody;
          }
        }
      } catch (e) {
        console.error("[Proxy] Error reading body:", e);
      }
    }

    // Собираем заголовки
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "host" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-length" &&
        lowerKey !== "transfer-encoding" &&
        lowerKey !== "content-type" // Исключаем Content-Type, установим его отдельно
      ) {
        headers[key] = value;
      }
    });

    // Устанавливаем Content-Type и Content-Length
    if (body) {
      if (isMultipart) {
        // Для multipart сохраняем оригинальный Content-Type с boundary
        headers["Content-Type"] = contentType;
        if (body instanceof ArrayBuffer) {
          headers["Content-Length"] = body.byteLength.toString();
        }
      } else {
        // Для остальных типов устанавливаем application/json
        headers["Content-Type"] = "application/json";
        if (typeof body === "string") {
          headers["Content-Length"] = new TextEncoder().encode(body).length.toString();
        }
      }
    }

    // Выполняем запрос к Express API
    // Для ArrayBuffer используем Uint8Array для совместимости
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

    // Читаем ответ
    const responseText = await response.text();
    let jsonData: unknown;
    
    try {
      jsonData = JSON.parse(responseText);
    } catch {
      jsonData = responseText;
    }

    // Формируем заголовки ответа
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
          message: error instanceof Error ? error.message : "Ошибка проксирования",
          details: {},
        },
      },
      { status: 500 }
    );
  }
}
