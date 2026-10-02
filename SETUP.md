# Настройка проекта KJÁR

## 🔧 Что нужно настроить самостоятельно

### 1. Переменные окружения (`.env`)

Создайте файл `.env` в корне проекта (если его нет, он создастся автоматически при запуске `bun run dev`).

#### Вариант A: Для работы с Docker (рекомендуется)

```env
# База данных (для Docker контейнеров)
POSTGRES_USER=kjar
POSTGRES_PASSWORD=kjar_password
POSTGRES_DB=kjar
DATABASE_URL=postgres://kjar:kjar_password@db:5432/kjar

# API
PORT=3001
BCRYPT_SALT_ROUNDS=12
JWT_SECRET=change_me_to_secure_random_string
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_BASE=http://localhost:3001/api/v1
```

> **Важно:** `DATABASE_URL` с хостом `db` работает только внутри Docker сети. Для локальных миграций см. Вариант B.

#### Вариант B: Для локальной работы с БД

Если вы хотите запускать миграции локально (без Docker), измените `DATABASE_URL`:

```env
# Для локальной PostgreSQL (порт DB_PORT=5433 проброшен из Docker)
DATABASE_URL=postgres://kjar:kjar_password@localhost:5433/kjar
```

Или если у вас своя локальная PostgreSQL:

```env
DATABASE_URL=postgres://your_user:your_password@localhost:5432/your_database
```

### 2. Безопасность

**Обязательно измените:**
- `POSTGRES_PASSWORD` - пароль для базы данных
- `JWT_SECRET` - секретный ключ для JWT токенов (используйте длинную случайную строку)

**Генерация безопасного JWT_SECRET:**
```bash
# Linux/Mac
openssl rand -base64 32

# Или своим раннером, без drizzle-kit
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Выбор способа работы с БД

#### Сценарий 1: Полностью через Docker (рекомендуется)

1. Используйте `DATABASE_URL` с хостом `db`
2. Запускайте миграции через: `bun run db:migrate:docker`
3. Убедитесь, что контейнеры запущены: `bun run dev`

#### Сценарий 2: Гибридный (Docker для БД, локально для кода)

1. Запустите только БД: `docker compose -f docker/docker-compose.dev.yml up db`
2. Измените `DATABASE_URL` на `postgres://kjar:kjar_password@localhost:5433/kjar`
3. Запускайте миграции локально: `bun run db:migrate`

#### Сценарий 3: Полностью локально

1. Установите PostgreSQL локально
2. Создайте базу данных и пользователя
3. Настройте `DATABASE_URL` на локальное подключение
4. Используйте `bun run db:migrate` для миграций

### 4. Первоначальная настройка БД

После настройки `.env`:

```bash
# 1. Запустите Docker контейнеры
bun run dev

# 2. В другом терминале примените миграции
bun run db:migrate:docker

# Или если используете локальную БД:
bun run db:migrate
```

### 5. Проверка подключения

Проверить подключение к БД можно через:

```bash
# Drizzle Studio (веб-интерфейс)
bun run db:studio

# Или через Adminer (если запущен через Docker)
# Откройте http://localhost:8081
# Сервер: db
# Пользователь: kjar (или из .env)
# Пароль: kjar_password (или из .env)
# База данных: kjar (или из .env)
```

### 6. Структура файлов окружения

```
.env              # Ваши реальные настройки (не коммитится в git)
.env.example      # Шаблон настроек (коммитится в git)
```

> ⚠️ **Важно:** Никогда не коммитьте `.env` в git! Он уже добавлен в `.gitignore`.

### 7. Типичные проблемы и решения

#### Проблема: `ENOTFOUND db`
**Причина:** Пытаетесь подключиться к хосту `db` локально  
**Решение:** 
- Используйте `bun run db:migrate:docker` для Docker окружения
- Или измените `DATABASE_URL` на `localhost` для локальной работы

#### Проблема: `connection refused` на `localhost:5433`
**Причина:** PostgreSQL не запущен или порт занят  
**Решение:**
- Проверьте, запущен ли Docker контейнер: `docker compose ps`
- Или запустите локальный PostgreSQL

#### Проблема: `password authentication failed`
**Причина:** Неправильные учетные данные в `DATABASE_URL`  
**Решение:** Проверьте `POSTGRES_USER`, `POSTGRES_PASSWORD` в `.env`

### 8. Рекомендуемый workflow

1. **Разработка:**
   ```bash
   # Запустите все сервисы
   bun run dev
   
   # В другом терминале - миграции
   bun run db:migrate:docker
   ```

2. **Изменение схемы:**
   ```bash
   # 1. Измените packages/db/src/schema.ts
   # 2. Сгенерируйте миграцию
   bun run db:generate
   # 3. Примените миграцию
   bun run db:migrate:docker
   ```

3. **Просмотр данных:**
   ```bash
   bun run db:studio
   # Откроется на http://localhost:4983
   ```

---

## 📝 Чеклист настройки

- [ ] Создан файл `.env` (или скопирован из `.env.example`)
- [ ] Изменен `POSTGRES_PASSWORD` на безопасный пароль
- [ ] Изменен `JWT_SECRET` на случайную строку
- [ ] Выбран способ работы с БД (Docker/локально/гибрид)
- [ ] Настроен правильный `DATABASE_URL` для выбранного способа
- [ ] Запущены контейнеры: `bun run dev`
- [ ] Применены миграции: `bun run db:migrate:docker` или `bun run db:migrate`
- [ ] Проверено подключение через `bun run db:studio` или Adminer

---

## 🌐 Если зависимости не качаются (доступ из РФ)

Проект собирается так, чтобы внешних источников было как можно меньше.
Сейчас их ровно два, и оба — обязательные:

| Источник | Что оттуда берётся | Кто к нему ходит |
|---|---|---|
| `registry.npmjs.org` | все пакеты **и сам bun** (`@oven/bun-linux-*-musl`) | сборка образов, `bun install` |
| `ghcr.io` | готовые образы `kjar-web` и `kjar-api` | только боевой сервер |

Готовый образ `oven/bun` намеренно не используется: он лежит только на
Docker Hub, а тот с российских адресов отдаёт `429` на анонимные загрузки.
bun ставится из npm поверх `node:22-alpine`, поэтому Docker Hub нужен лишь
для базовых образов (`node`, `postgres`, `nginx`, `minio`).

### Docker Hub отдаёт 429 или таймаут

На сервере зеркало уже прописывает `scripts/server-bootstrap.sh`. На рабочей
машине его нужно добавить руками — в Docker Desktop это
*Settings → Docker Engine*:

```json
{
  "registry-mirrors": ["https://dockerhub.timeweb.cloud", "https://mirror.gcr.io"]
}
```

После сохранения Docker перезапустится сам.

### Реестр npm недоступен

Адрес реестра вынесен в аргумент сборки, файлы править не нужно:

```bash
docker compose --env-file .env -f docker/docker-compose.dev.yml \
  build --build-arg NPM_REGISTRY=https://зеркало

# то же самое для локального bun вне контейнера
BUN_CONFIG_REGISTRY=https://зеркало bun install
```

Постоянный вариант — дописать в `bunfig.toml`:

```toml
[install]
registry = "https://зеркало"
```

### Проверить, что именно не открывается

```bash
curl -sI https://registry.npmjs.org/bun | head -1
curl -sI https://ghcr.io/v2/ | head -1
docker pull node:22-alpine
```

---

## 🔗 Полезные ссылки

- [Документация Drizzle ORM](https://orm.drizzle.team/)
- [Документация PostgreSQL](https://www.postgresql.org/docs/)
- [Docker Compose документация](https://docs.docker.com/compose/)
