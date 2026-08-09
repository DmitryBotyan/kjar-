#!/usr/bin/env bash
# Выкладка KJÁR на сервер. Запускать с локальной машины из корня проекта:
#   ./scripts/deploy.sh <host> [user] [remote_dir]
# Пример: ./scripts/deploy.sh 94.228.112.9
set -euo pipefail

HOST="${1:?Укажите адрес сервера: ./scripts/deploy.sh 94.228.112.9}"
USER="${2:-root}"
REMOTE_DIR="${3:-/opt/kjar}"
SSH="ssh -o StrictHostKeyChecking=accept-new ${USER}@${HOST}"
COMPOSE="docker compose --env-file .env.production -f docker/docker-compose.prod.yml"

if [ ! -f .env.production ]; then
  echo "Нет .env.production. Скопируйте .env.production.example, заполните секреты и повторите."
  exit 1
fi

echo "==> Копируем проект в ${USER}@${HOST}:${REMOTE_DIR}"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .DS_Store \
  --exclude '*.tsbuildinfo' \
  --exclude .env \
  ./ "${USER}@${HOST}:${REMOTE_DIR}/"

echo "==> Отдельно кладём .env.production (в rsync он исключён вместе с .env)"
scp -q .env.production "${USER}@${HOST}:${REMOTE_DIR}/.env.production"

echo "==> Сборка образов на сервере"
$SSH "cd ${REMOTE_DIR} && ${COMPOSE} build"

echo "==> Поднимаем базу и ждём готовности"
$SSH "cd ${REMOTE_DIR} && ${COMPOSE} up -d db"
$SSH "cd ${REMOTE_DIR} && timeout 120 bash -c 'until ${COMPOSE} exec -T db pg_isready -U \$(grep ^POSTGRES_USER .env.production | cut -d= -f2) > /dev/null 2>&1; do sleep 3; done'"

echo "==> Миграции"
$SSH "cd ${REMOTE_DIR} && ${COMPOSE} --profile tools run --rm migrate"

echo "==> Запуск api, web, nginx"
$SSH "cd ${REMOTE_DIR} && ${COMPOSE} up -d api web nginx"

echo "==> Состояние"
$SSH "cd ${REMOTE_DIR} && ${COMPOSE} ps"

cat <<NOTE

Готово. Проверьте: http://${HOST}

Сид на боевую базу НЕ запускается автоматически: он очищает таблицы.
Если база должна быть пустой — так и оставьте, контент заводится через /admin.

Выпуск сертификата, когда домен будет направлен на сервер:
  ssh ${USER}@${HOST} "cd ${REMOTE_DIR} && ${COMPOSE} --profile tools run --rm certbot certonly \\
    --webroot -w /var/www/certbot -d example.ru -d www.example.ru --email you@example.ru --agree-tos --no-eff-email"
Затем раскомментируйте блок 443 в docker/nginx/kjar.conf и перезапустите nginx.
NOTE
