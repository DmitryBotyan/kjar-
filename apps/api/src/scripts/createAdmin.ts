/**
 * Создание или обновление администратора.
 * Роль admin через публичную регистрацию не выдаётся, поэтому первого
 * админа заводим этим скриптом.
 *
 *   docker compose exec api node --import tsx src/scripts/createAdmin.ts <логин> <пароль>
 *
 * Пароль можно передать через ADMIN_PASSWORD, чтобы он не попал в историю
 * команд оболочки.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "@kjar/db";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

async function main() {
  const username = process.argv[2] || process.env.ADMIN_USERNAME;
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;
  const role = process.env.ADMIN_ROLE || "admin";

  if (!username || !password) {
    console.error("Укажите логин и пароль: createAdmin.ts <логин> <пароль>");
    process.exit(1);
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    console.error("Логин: латиница, цифры, дефис, точка, подчёркивание");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Пароль администратора — от 12 символов");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, role, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    console.log(`Пароль и роль обновлены: ${username} (${role})`);
  } else {
    const [created] = await db
      .insert(users)
      .values({ username, passwordHash, role })
      .returning({ id: users.id });
    console.log(`Создан пользователь ${username} (${role}), id ${created.id}`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Не удалось создать администратора:", error);
  process.exit(1);
});
