import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@kjar/db";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL не установлена в переменных окружения");
}

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Безопасность: не логируем пароли
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
