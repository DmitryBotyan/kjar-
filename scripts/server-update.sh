#!/usr/bin/env bash
# Обновление KJÁR на сервере. Запускается НА СЕРВЕРЕ: сервер сам тянет свежие
# образы из реестра GitHub, поэтому входящий доступ извне не нужен.
#
#   bash /opt/kjar/scripts/server-update.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/kjar}"
COMPOSE="docker compose --env-file .env.production -f docker/docker-compose.prod.yml"

cd "$APP_DIR"

if [ ! -f .env.production ]; then
  echo "Нет $APP_DIR/.env.production — заполните боевые переменные и повторите."
  exit 1
fi

echo "== тянем свежие образы =="
$COMPOSE pull api web

echo "== база =="
$COMPOSE up -d db
echo "ждём готовности базы"
for i in $(seq 1 40); do
  if $COMPOSE exec -T db pg_isready > /dev/null 2>&1; then break; fi
  sleep 3
done

echo "== миграции =="
$COMPOSE --profile tools run --rm migrate

echo "== запуск =="
$COMPOSE up -d
$COMPOSE ps

echo "== проверка =="
for i in $(seq 1 24); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/ || true)
  echo "попытка $i: $code"
  if [ "$code" = "200" ]; then
    echo "сайт отвечает"
    exit 0
  fi
  sleep 5
done

echo "сайт не ответил, последние логи:"
$COMPOSE logs --tail=60 web api nginx
exit 1
