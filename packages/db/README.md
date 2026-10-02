# @kjar/db

Пакет для работы с базой данных проекта KJÁR.

## Команды

### Генерация миграций
```bash
bun run db:generate
# или
bun run --filter @kjar/db generate
```
Генерирует SQL файлы миграций на основе изменений в схеме.

### Применение миграций

**Для Docker окружения (рекомендуется):**
```bash
bun run db:migrate:docker
```
Скрипт автоматически:
- Проверяет и создаёт `.env.example` и `.env` (если их нет)
- Проверяет, что контейнеры запущены
- При необходимости запускает контейнер БД
- Применяет миграции внутри Docker контейнера API, где доступен хост `db`

> **Примечание:** Работает аналогично `run-dev.sh` - использует те же настройки окружения.

**Для локального окружения:**
```bash
# Через drizzle-kit
bun run db:migrate

# Свой раннер на drizzle-orm, без drizzle-kit (альтернатива)
bun run db:migrate:node
```

> **Примечание:** 
> - Для Docker используйте `bun run db:migrate:docker` (требует запущенные контейнеры)
> - Для локальной БД измените `DATABASE_URL` в `.env` на `postgres://user:password@localhost:5432/dbname` и используйте `bun run db:migrate`

### Push схемы в БД (без создания файлов)
```bash
bun run db:push
# или
bun run --filter @kjar/db push
```
Полезно для быстрого прототипирования. Не создаёт файлы миграций.

### Drizzle Studio
```bash
bun run db:studio
# или
bun run --filter @kjar/db studio
```
Открывает веб-интерфейс для просмотра и редактирования данных в БД.

### Интроспекция БД
```bash
bun run db:introspect
# или
bun run --filter @kjar/db introspect
```
Генерирует схему Drizzle на основе существующей структуры БД.

## Переменные окружения

Требуется `DATABASE_URL` в формате:
```
DATABASE_URL=postgres://user:password@localhost:5432/dbname
```

> **Важно:** Команды автоматически загружают переменные окружения из файла `.env` в корне проекта. Убедитесь, что база данных запущена перед применением миграций. Для Docker используйте `postgres://user:password@db:5432/dbname`, для локальной БД - `postgres://user:password@localhost:5432/dbname`.

## Структура

- `src/schema.ts` - схема базы данных (таблицы, связи)
- `src/migrate.ts` - скрипт для применения миграций напрямую через drizzle-orm
- `src/migrate-kit.ts` - обёртка для drizzle-kit migrate с загрузкой .env
- `src/index.ts` - экспорт схемы
- `migrations/` - папка с SQL файлами миграций (создаётся автоматически)

## Примеры использования

### Полный цикл работы с миграциями

1. **Измените схему** в `src/schema.ts`
2. **Сгенерируйте миграцию:**
   ```bash
   bun run db:generate
   ```
3. **Примените миграцию:**
   ```bash
   # Для Docker окружения
   bun run db:migrate:docker
   
   # Для локального окружения
   bun run db:migrate
   ```
