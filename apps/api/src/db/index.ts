import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@kjar/db";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL не установлена в переменных окружения");
}

// SSL включаем только если он реально нужен: база в той же docker-сети
// его не поддерживает, а привязка к NODE_ENV ломала подключение в проде.
// Для внешней управляемой базы достаточно задать DATABASE_SSL=true.
const useSsl =
  process.env.DATABASE_SSL === "true" ||
  /[?&]sslmode=require/.test(connectionString);

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
