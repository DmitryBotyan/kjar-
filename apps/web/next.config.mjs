import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Для продакшн-образа: Next кладёт минимальный сервер в .next/standalone
  output: "standalone",
  // Монорепозиторий: трассировку файлов ведём от корня, иначе standalone
  // остаётся без node_modules и сервер не стартует
  experimental: {
    outputFileTracingRoot: path.join(dir, "../..")
  },
  poweredByHeader: false,
  // Переменные окружения для серверных запросов
  env: {
    API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1",
  },
};

export default nextConfig;
