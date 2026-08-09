import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

// Загружаем переменные окружения из .env файла в корне проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../..");
dotenv.config({ path: resolve(rootDir, ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL не установлена в переменных окружения");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString
});

const db = drizzle(pool);

async function runMigrations() {
  try {
    console.log("🔄 Применение миграций...");
    
    await migrate(db, {
      migrationsFolder: join(__dirname, "../migrations")
    });
    
    console.log("✅ Миграции успешно применены");
    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при применении миграций:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
