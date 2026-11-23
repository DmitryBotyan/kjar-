import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Сайт закрыт общим паролем. В бою пароль задаёт SITE_PASSWORD; пока его нет,
// работает запасной, чтобы сайт не оставался открытым. В разработке защиты нет.
const SITE_PASSWORD = process.env.SITE_PASSWORD;
const FALLBACK_HASH =
  "4239901eeaee350c877b76e36a63ee366d53a7f894c5cef227b3d5eb857bbdfb";

function sameText(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function passwordMatches(candidate: string): Promise<boolean> {
  if (SITE_PASSWORD) return sameText(candidate, SITE_PASSWORD);
  if (process.env.NODE_ENV !== "production") return true;
  return sameText(await sha256(candidate), FALLBACK_HASH);
}

export async function middleware(request: NextRequest) {
  if (!SITE_PASSWORD && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const header = request.headers.get("authorization");
  if (header && header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const password = decoded.slice(decoded.indexOf(":") + 1);
      if (await passwordMatches(password)) return NextResponse.next();
    } catch {
      // Битая строка авторизации считается неудачной попыткой
    }
  }

  return new NextResponse("Сайт закрыт паролем", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="KJAR", charset="UTF-8"',
      "Cache-Control": "no-store"
    }
  });
}

// Служебные запросы и API не закрываем: прокси и статика должны работать
export const config = {
  matcher: ["/((?!api|_next|images|fonts|favicon.ico|icon.png).*)"]
};
