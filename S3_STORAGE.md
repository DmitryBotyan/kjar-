# S3 Storage Integration

Простая интеграция S3-совместимого хранилища (MinIO) в проект.

## Быстрый старт

### 1. Запуск с Docker

Просто запустите проект как обычно:

```bash
pnpm dev
```

MinIO автоматически запустится в Docker и будет доступен на:
- **API**: http://localhost:9000
- **Консоль**: http://localhost:9001

### 2. Доступ к MinIO консоли

1. Откройте http://localhost:9001
2. Войдите с учетными данными из `.env`:
   - Username: `minioadmin` (по умолчанию)
   - Password: `minioadmin` (по умолчанию)

### 3. Переменные окружения

Все настройки S3 находятся в `.env`:

```env
# MinIO / S3 Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=kjar
S3_REGION=us-east-1
S3_PUBLIC_URL=http://localhost:9000
```

## API Endpoints

### Загрузка одного файла

```bash
POST /api/v1/upload/single?folder=images
Content-Type: multipart/form-data

# Форма с полем "file"
```

**Ответ:**
```json
{
  "data": {
    "key": "images/uuid.jpg",
    "url": "http://localhost:9000/kjar/images/uuid.jpg",
    "publicUrl": "http://localhost:9000/kjar/images/uuid.jpg",
    "size": 12345,
    "contentType": "image/jpeg",
    "originalName": "photo.jpg"
  }
}
```

### Загрузка нескольких файлов

```bash
POST /api/v1/upload/multiple?folder=documents
Content-Type: multipart/form-data

# Форма с полем "files" (массив)
```

**Ответ:**
```json
{
  "data": [
    {
      "key": "documents/uuid1.pdf",
      "url": "http://localhost:9000/kjar/documents/uuid1.pdf",
      "publicUrl": "http://localhost:9000/kjar/documents/uuid1.pdf",
      "size": 12345,
      "contentType": "application/pdf",
      "originalName": "document1.pdf"
    }
  ]
}
```

### Получение информации о файле

```bash
GET /api/v1/upload/:key
```

**Пример:**
```bash
GET /api/v1/upload/images/uuid.jpg
```

### Удаление файла

```bash
DELETE /api/v1/upload/:key
```

**Пример:**
```bash
DELETE /api/v1/upload/images/uuid.jpg
```

## Использование в коде

### Загрузка файла

```typescript
import { uploadFile } from "./storage/s3.js";

// В контроллере
const result = await uploadFile(req.file, "images");
// result.url - публичный URL файла
```

### Загрузка буфера

```typescript
import { uploadBuffer } from "./storage/s3.js";

const result = await uploadBuffer(
  buffer,
  "image.jpg",
  "image/jpeg",
  "images"
);
```

### Проверка существования файла

```typescript
import { fileExists } from "./storage/s3.js";

const exists = await fileExists("images/uuid.jpg");
```

### Удаление файла

```typescript
import { deleteFile } from "./storage/s3.js";

await deleteFile("images/uuid.jpg");
```

### Получение публичного URL

```typescript
import { getPublicUrl } from "./storage/s3.js";

const url = getPublicUrl("images/uuid.jpg");
```

## Поддерживаемые типы файлов

- Изображения: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
- Документы: `application/pdf`
- Текст: `text/plain`, `text/markdown`

**Максимальный размер файла:** 10MB

## Структура папок

Файлы автоматически сохраняются в папки по типу:

- `uploads/` - общие загрузки (по умолчанию)
- `images/` - изображения
- `documents/` - документы
- `events/` - файлы для ивентов
- `characters/` - изображения персонажей

Можно указать любую папку через параметр `folder` в запросе.

## Безопасность

- Все эндпоинты загрузки требуют аутентификации
- Файлы проверяются по типу MIME
- Ограничение размера файла: 10MB
- Имена файлов генерируются автоматически (UUID) для безопасности

## Production

Для production окружения:

1. Измените `S3_ENDPOINT` на ваш реальный S3 endpoint
2. Установите реальные `S3_ACCESS_KEY` и `S3_SECRET_KEY`
3. Обновите `S3_PUBLIC_URL` на публичный URL вашего S3 хранилища
4. Настройте CORS в MinIO/S3 для доступа с вашего домена

## Troubleshooting

### MinIO не запускается

Проверьте, что порты 9000 и 9001 свободны:
```bash
lsof -i :9000
lsof -i :9001
```

### Файлы не загружаются

1. Проверьте, что MinIO запущен: `docker compose ps`
2. Проверьте логи: `docker compose logs minio`
3. Убедитесь, что bucket `kjar` создан (создается автоматически)

### Файлы недоступны по публичному URL

1. Проверьте настройки bucket policy в MinIO консоли
2. Убедитесь, что `S3_PUBLIC_URL` правильный
3. Для MinIO может потребоваться настройка anonymous access
