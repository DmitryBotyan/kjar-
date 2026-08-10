#!/usr/bin/env bash
# Самообновление боевого сервера.
#
# До московского сервера не достучаться снаружи: SSH-соединения с раннера
# не доходят, а протокол фильтруется. Поэтому сервер сам ходит за обновлениями:
# забирает конфиги из репозитория и образы из ghcr.io, оба источника открыты.
# Входящие соединения для выкладки не нужны вовсе.
#
# Ставится systemd-таймером, см. scripts/install-self-update.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/kjar}"
SRC_DIR="$APP_DIR/src"
ENV_FILE="$APP_DIR/.env.production"
COMPOSE="docker compose --env-file $ENV_FILE -f $SRC_DIR/docker/docker-compose.prod.yml"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Проверки идут каждые пару минут: если предыдущая ещё работает, выходим
exec 9> "$APP_DIR/.update.lock"
if ! flock -n 9; then
  exit 0
fi

if [ ! -f "$ENV_FILE" ]; then
  log "нет $ENV_FILE, обновление невозможно"
  exit 1
fi

# --- конфиги
git -C "$SRC_DIR" fetch --quiet --depth 1 origin main
before_commit=$(git -C "$SRC_DIR" rev-parse HEAD)
git -C "$SRC_DIR" reset --quiet --hard origin/main
after_commit=$(git -C "$SRC_DIR" rev-parse HEAD)

# --- образы
images=$($COMPOSE config --images 2>/dev/null | grep ghcr.io | sort -u)
before_ids=$(docker image inspect --format '{{.Id}}' $images 2>/dev/null | sort | tr '\n' ' ')
$COMPOSE pull --quiet api web 2>/dev/null || $COMPOSE pull api web
after_ids=$(docker image inspect --format '{{.Id}}' $images 2>/dev/null | sort | tr '\n' ' ')

running=$(docker ps --filter "name=kjar-prod-" --format '{{.Names}}' | wc -l)

if [ "$before_commit" = "$after_commit" ] && [ "$before_ids" = "$after_ids" ] && [ "$running" -ge 5 ]; then
  exit 0
fi

log "обновление: коммит ${before_commit:0:7} -> ${after_commit:0:7}, контейнеров запущено $running"

# --- база и миграции
$COMPOSE up -d db
timeout 180 bash -c "until $COMPOSE exec -T db pg_isready > /dev/null 2>&1; do sleep 3; done"
$COMPOSE --profile tools run --rm migrate

# --- запуск
$COMPOSE up -d
# У nginx после пересоздания web новый адрес контейнера: перечитываем конфиг
$COMPOSE exec -T nginx nginx -s reload || $COMPOSE restart nginx

# --- проверка
for i in $(seq 1 24); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/ || true)
  if [ "$code" = "200" ]; then
    log "готово, сайт отвечает 200"
    docker image prune -f > /dev/null
    exit 0
  fi
  sleep 5
done

log "сайт не ответил 200 после обновления, последние логи:"
$COMPOSE logs --tail=40 web api nginx
exit 1
