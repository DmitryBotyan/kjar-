#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Создаём .env.example если его нет (как в run-dev.sh)
if [ ! -f .env.example ]; then
  cat <<'ENVEOF' > .env.example
POSTGRES_USER=kjar
POSTGRES_PASSWORD=kjar_password
POSTGRES_DB=kjar
DATABASE_URL=postgres://kjar:kjar_password@db:5432/kjar
DB_PORT=5433

PORT=3001
BCRYPT_SALT_ROUNDS=12
JWT_SECRET=change_me
CORS_ORIGIN=http://localhost:3000

NEXT_PUBLIC_API_BASE=http://localhost:3001/api/v1
ENVEOF
fi

# Создаём .env из .env.example если его нет (как в run-dev.sh)
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Update values if needed."
fi

# Проверяем, запущен ли контейнер API
# Используем простую проверку через docker compose ps
API_PS_OUTPUT=$(docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml ps api 2>/dev/null)

if ! echo "$API_PS_OUTPUT" | grep -qE "(Up|running)"; then
  echo "❌ Контейнер API не запущен"
  echo ""
  echo "Запустите контейнеры командой:"
  echo "  bun run dev"
  echo ""
  echo "Или только базу данных:"
  echo "  docker compose --env-file .env -f docker/docker-compose.dev.yml up -d db"
  exit 1
fi

# Проверяем, что база данных тоже запущена
DB_PS_OUTPUT=$(docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml ps db 2>/dev/null)

if ! echo "$DB_PS_OUTPUT" | grep -qE "(Up|running)"; then
  echo "⚠️  Контейнер БД не запущен, запускаю..."
  docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml up -d db
  echo "⏳ Ожидание готовности БД..."
  sleep 3
fi

echo "🔄 Применение миграций в Docker контейнере..."

# Устанавливаем зависимости, если их нет (как в run-dev.sh)
echo "📦 Проверка зависимостей..."
docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml exec -T api sh -c "if [ ! -d /app/node_modules/@kjar ]; then bun install --frozen-lockfile; fi"

# Миграции применяет собственный раннер на drizzle-orm, а не drizzle-kit:
# drizzle-kit читает свой конфиг через esbuild и на смонтированном томе
# спотыкается об EAGAIN, тогда как bun разбирает TypeScript сам.
# .env подхватывается из корня проекта
echo "🚀 Запуск миграций..."
docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml exec -T api sh -c "cd /app/packages/db && bun run migrate:direct"
