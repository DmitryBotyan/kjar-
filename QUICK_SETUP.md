# 🚀 Быстрая настройка

## Минимальные шаги для начала работы

### 1. Настройте `.env` файл

Файл `.env` создастся автоматически при первом запуске `pnpm dev`, но лучше настроить его сразу:

```bash
# Скопируйте шаблон (если еще нет)
cp .env.example .env
```

**Обязательно измените:**
- `JWT_SECRET` - сгенерируйте случайную строку (см. ниже)
- `POSTGRES_PASSWORD` - придумайте безопасный пароль

**Генерация JWT_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Выберите способ работы с БД

#### ✅ Вариант 1: Docker (рекомендуется)
```env
DATABASE_URL=postgres://kjar:kjar_password@db:5432/kjar
```
**Используйте:** `pnpm db:migrate:docker`

#### ✅ Вариант 2: Локально
```env
DATABASE_URL=postgres://kjar:kjar_password@localhost:5433/kjar
```
**Используйте:** `pnpm db:migrate`

### 3. Запустите проект

```bash
# Запуск всех сервисов
pnpm dev

# В другом терминале - примените миграции
pnpm db:migrate:docker  # для Docker
# или
pnpm db:migrate         # для локальной БД
```

### 4. Проверьте работу

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Adminer: http://localhost:8081
- Drizzle Studio: `pnpm db:studio`

---

## ⚠️ Частые проблемы

| Проблема | Решение |
|----------|---------|
| `ENOTFOUND db` | Используйте `pnpm db:migrate:docker` или измените `DATABASE_URL` на `localhost` |
| `connection refused` | Запустите БД: `pnpm dev` или `docker compose up db` |
| `password authentication failed` | Проверьте учетные данные в `.env` |

---

## 📋 Команды для работы с БД

```bash
# Генерация миграций (после изменения schema.ts)
pnpm db:generate

# Применение миграций
pnpm db:migrate:docker  # Docker
pnpm db:migrate         # Локально

# Просмотр БД
pnpm db:studio

# Быстрый push схемы (без миграций)
pnpm db:push
```

---

Подробная документация: см. `SETUP.md`
