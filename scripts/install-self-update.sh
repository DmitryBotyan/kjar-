#!/usr/bin/env bash
# Ставит на сервер самообновление: клон репозитория и таймер systemd.
# Запускать НА СЕРВЕРЕ от root, после server-bootstrap.sh:
#   bash install-self-update.sh
#
# .env.production скрипт не трогает: секреты кладутся на сервер один раз руками.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/kjar}"
SRC_DIR="$APP_DIR/src"
REPO="${REPO:-https://github.com/DmitryBotyan/kjar-.git}"
INTERVAL="${INTERVAL:-2min}"

mkdir -p "$APP_DIR"

if [ ! -d "$SRC_DIR/.git" ]; then
  echo "==> Клонируем конфиги"
  git clone --depth 1 --branch main "$REPO" "$SRC_DIR"
else
  git -C "$SRC_DIR" fetch --depth 1 origin main
  git -C "$SRC_DIR" reset --hard origin/main
fi

chmod +x "$SRC_DIR/scripts/self-update.sh"

cat > /etc/systemd/system/kjar-update.service <<SERVICE
[Unit]
Description=Обновление KJÁR из реестра и репозитория
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
Environment=APP_DIR=$APP_DIR
ExecStart=$SRC_DIR/scripts/self-update.sh
StandardOutput=append:/var/log/kjar-update.log
StandardError=append:/var/log/kjar-update.log
SERVICE

cat > /etc/systemd/system/kjar-update.timer <<TIMER
[Unit]
Description=Проверка обновлений KJÁR каждые $INTERVAL

[Timer]
OnBootSec=1min
OnUnitActiveSec=$INTERVAL
AccuracySec=15s

[Install]
WantedBy=timers.target
TIMER

# Логи обновления не должны расти бесконечно
cat > /etc/logrotate.d/kjar-update <<'ROTATE'
/var/log/kjar-update.log {
  weekly
  rotate 4
  compress
  missingok
  notifempty
  copytruncate
}
ROTATE

systemctl daemon-reload
systemctl enable --now kjar-update.timer
systemctl list-timers kjar-update.timer --no-pager | head -3

cat <<NOTE

Готово. Сервер сам проверяет обновления каждые $INTERVAL.

  Разовый прогон:      systemctl start kjar-update.service
  Что происходило:     tail -f /var/log/kjar-update.log
  Остановить:          systemctl disable --now kjar-update.timer
NOTE
