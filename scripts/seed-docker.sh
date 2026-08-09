#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "❌ Файл .env не найден."
  echo "Создайте .env (например, из .env.example) и настройте DATABASE_URL."
  exit 1
fi

API_PS_OUTPUT=$(docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml ps api 2>/dev/null)
if ! echo "$API_PS_OUTPUT" | grep -qE "(Up|running)"; then
  echo "❌ Контейнер API не запущен"
  echo ""
  echo "Запустите контейнеры: pnpm dev"
  echo "Затем в другом терминале: pnpm db:seed:docker"
  exit 1
fi

DB_PS_OUTPUT=$(docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml ps db 2>/dev/null)
if ! echo "$DB_PS_OUTPUT" | grep -qE "(Up|running)"; then
  echo "⚠️  Контейнер БД не запущен, запускаю..."
  docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml up -d db
  echo "⏳ Ожидание готовности БД..."
  sleep 3
fi

echo "📦 Установка зависимостей..."
docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml exec -T api sh -c "cd /app && CI=true pnpm install --frozen-lockfile"

echo "🌱 Запуск seed в Docker контейнере API..."
docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml exec -T api sh -c "cd /app && pnpm --filter @kjar/db seed"
