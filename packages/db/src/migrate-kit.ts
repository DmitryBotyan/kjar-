import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../..");

const envPath = resolve(rootDir, ".env");
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL не установлена в переменных окружения");
  console.error("Проверьте файл .env в корне проекта");
  process.exit(1);
}

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
