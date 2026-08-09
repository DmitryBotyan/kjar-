# Решение проблем с Docker

## Проблема: TLS handshake timeout при загрузке образов

Если вы видите ошибку `TLS handshake timeout` при попытке загрузить образы Docker, попробуйте следующие решения:

### Решение 1: Повторите попытку
Часто это временная проблема с Docker Hub. Просто запустите команду снова:
```bash
./run-dev.sh
```

### Решение 2: Загрузите образ вручную
```bash
docker pull node:20-alpine
docker pull postgres:16-alpine
docker pull adminer:latest
```

Затем запустите:
```bash
./run-dev.sh
```

### Решение 3: Используйте Docker с увеличенным таймаутом
Создайте или отредактируйте `~/.docker/daemon.json`:
```json
{
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5
}
```

Перезапустите Docker Desktop или Docker daemon.

### Решение 4: Используйте альтернативный registry (если доступен)
Если у вас есть доступ к корпоративному registry или mirror, настройте его в `~/.docker/daemon.json`:
```json
{
  "registry-mirrors": ["https://your-mirror-url"]
}
```

### Решение 5: Проверьте сетевые настройки
- Убедитесь, что у вас есть доступ к интернету
- Проверьте настройки прокси (если используете)
- Проверьте firewall настройки

### Решение 6: Используйте локальную разработку без Docker
Если проблемы с Docker продолжаются, вы можете запустить проект локально:

1. Установите зависимости локально:
```bash
pnpm install
```

2. Запустите только базу данных в Docker:
```bash
docker compose -f docker/docker-compose.dev.yml up -d db
```

3. Запустите API и Web локально:
```bash
# В одном терминале
pnpm --filter @kjar/api dev

# В другом терминале
pnpm --filter @kjar/web dev
```

Не забудьте изменить `DATABASE_URL` в `.env` на `postgres://kjar:kjar_password@localhost:5433/kjar`

## Проверка состояния Docker

Проверьте, что Docker работает:
```bash
docker info
docker ps
```

Проверьте доступность Docker Hub:
```bash
curl -I https://registry-1.docker.io/v2/
```

## Очистка кэша Docker (если нужно)

Если проблемы продолжаются, попробуйте очистить кэш:
```bash
docker system prune -a
```

**Внимание:** Это удалит все неиспользуемые образы, контейнеры и сети.
