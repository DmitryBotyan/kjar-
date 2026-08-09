import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { execSync } from "child_process";

// Загружаем переменные окружения из .env файла в корне проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// packages/db/src -> packages/db -> корень проекта
const rootDir = resolve(__dirname, "../../..");

const envPath = resolve(rootDir, ".env");
dotenv.config({ path: envPath });

// Проверяем наличие DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL не установлена в переменных окружения");
  console.error("Проверьте файл .env в корне проекта");
  process.exit(1);
}

// Запускаем drizzle-kit migrate с переменными окружения
try {
  execSync("drizzle-kit migrate", {
    stdio: "inherit",
    env: process.env,
    cwd: resolve(__dirname, "..")
  });
} catch (error) {
  console.error("❌ Ошибка при применении миграций");
  process.exit(1);
}
