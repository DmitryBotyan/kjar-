#!/usr/bin/env bash
# Подготовка чистого сервера Ubuntu под KJÁR.
# Запускать НА СЕРВЕРЕ от root: bash server-bootstrap.sh
set -euo pipefail

SWAP_SIZE="${SWAP_SIZE:-2G}"
APP_DIR="${APP_DIR:-/opt/kjar}"

echo "==> Обновление пакетов"
apt-get update -y
apt-get upgrade -y
# fail2ban намеренно не ставим: он банил раннеры GitHub, и выкладка переставала
# доходить до сервера. Защита строится иначе — вход только по ключу и ufw.
apt-get install -y ca-certificates curl gnupg ufw rsync

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

echo "==> Зеркало Docker Hub"
# С российских адресов Docker Hub быстро отдаёт 429 на анонимные загрузки.
# Зеркало Timeweb снимает лимит; образы из ghcr.io тянутся напрямую и это не
# затрагивает. На зарубежном сервере блок можно не применять, вреда от него нет.
mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'JSON'
{
  "registry-mirrors": ["https://dockerhub.timeweb.cloud", "https://mirror.gcr.io"],
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
  systemctl restart docker
fi
docker info 2>/dev/null | grep -A2 "Registry Mirrors" || true

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

Дальше выкладка идёт через GitHub Actions, вручную ничего запускать не нужно.

После первого удачного входа по ключу закройте вход по паролю:
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  systemctl reload ssh
NOTE
