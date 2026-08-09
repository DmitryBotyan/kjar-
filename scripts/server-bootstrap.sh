#!/usr/bin/env bash
# Подготовка чистого сервера Ubuntu под KJÁR.
# Запускать НА СЕРВЕРЕ от root: bash server-bootstrap.sh
set -euo pipefail

SWAP_SIZE="${SWAP_SIZE:-2G}"
APP_DIR="${APP_DIR:-/opt/kjar}"

echo "==> Обновление пакетов"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg ufw fail2ban rsync

echo "==> Swap"
if swapon --show | grep -q swapfile; then
  echo "swap уже есть, пропускаем"
else
  fallocate -l "$SWAP_SIZE" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q "^/swapfile" /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  printf 'vm.swappiness=10\nvm.vfs_cache_pressure=50\n' > /etc/sysctl.d/99-swap.conf
  sysctl --system > /dev/null
fi
free -h

echo "==> Docker"
if ! command -v docker > /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi
docker --version
docker compose version

echo "==> Файрвол"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

echo "==> Каталог приложения"
mkdir -p "$APP_DIR"
echo "готово: $APP_DIR"

cat <<'NOTE'

Дальше с локальной машины:
  ./scripts/deploy.sh 94.228.112.9

После первого удачного входа по ключу закройте вход по паролю:
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  systemctl reload ssh
NOTE
