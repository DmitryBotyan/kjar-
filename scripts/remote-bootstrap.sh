#!/usr/bin/env bash
# Идемпотентная подготовка сервера. Запускается на самом сервере, в фоне,
# чтобы обрыв ssh-сессии не прерывал установку.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "== rsync =="
if ! command -v rsync > /dev/null; then
  apt-get update -qq
  apt-get install -y -qq rsync
fi
rsync --version | head -1

echo "== docker =="
if ! command -v docker > /dev/null; then
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  systemctl enable --now docker
fi
docker --version
docker compose version

echo "== swap =="
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q "^/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab
  printf 'vm.swappiness=10\nvm.vfs_cache_pressure=50\n' > /etc/sysctl.d/99-swap.conf
  sysctl --system > /dev/null
fi
free -m | head -2

mkdir -p /opt/kjar
echo "== готово =="
