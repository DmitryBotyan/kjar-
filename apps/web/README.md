# Next.js Frontend - KJÁR

## Архитектура запросов к API

Все запросы к Express API выполняются **на сервере Next.js**, а не на клиенте. Next.js выступает в роли прокси между клиентом и Express API.

### Как это работает:

1. **Server Components** - все страницы используют async Server Components
2. **API Routes** - `/app/api/[...path]/route.ts` проксирует запросы к Express API
3. **Утилиты** - `/lib/api.ts` содержит функции для запросов к API на сервере

### Структура:

```
/app
  /api/[...path]/route.ts  # Универсальный прокси для всех API запросов
  /page.tsx                 # Главная страница (Server Component)
  /characters/page.tsx      # Список персонажей (Server Component)
  /characters/[id]/page.tsx # Детальная страница персонажа (Server Component)
  /lore/page.tsx            # Список статей (Server Component)
  /lore/[slug]/page.tsx     # Детальная страница статьи (Server Component)
  /posts/page.tsx           # Список постов (Server Component)
  /events/page.tsx          # Список событий (Server Component)
  /discussions/page.tsx     # Список обсуждений (Server Component)

/lib
  /api.ts                   # Утилиты для запросов к Express API на сервере
```

## Переменные окружения

В `.env` файле должны быть настроены:

```env
# URL Express API (используется на сервере Next.js)
API_BASE_URL=http://localhost:3001/api/v1

# Или через NEXT_PUBLIC_API_BASE (для совместимости)
NEXT_PUBLIC_API_BASE=http://localhost:3001/api/v1
```

**Важно:** `API_BASE_URL` используется только на сервере Next.js. Клиент никогда не делает прямых запросов к Express API.

## Использование

### В Server Components:

```tsx
import { getCharacters } from "@/lib/api";

export default async function CharactersPage() {
  const response = await getCharacters({ limit: 50 });
  const characters = response.data;
  
  return (
    <div>
      {characters.map((character) => (
        <div key={character.id}>{character.name}</div>
      ))}
    </div>
  );
}
```

### Фильтрация и поиск:

```tsx
export default async function CharactersPage({ 
  searchParams 
}: { 
  searchParams: { role?: string; search?: string } 
}) {
  const response = await getCharacters({
    role: searchParams.role,
    search: searchParams.search,
  });
  
  // ...
}
```

## Преимущества такого подхода:

1. **Безопасность** - клиент не имеет прямого доступа к Express API
2. **SEO** - данные загружаются на сервере, контент доступен для поисковиков
3. **Производительность** - меньше запросов с клиента, кэширование на сервере
4. **Контроль** - можно добавить дополнительную логику, валидацию, кэширование

## API Routes (прокси)

Все запросы к Express API проходят через `/app/api/[...path]/route.ts`:

- `GET /api/articles` → проксирует к `http://localhost:3001/api/v1/articles`
- `GET /api/characters` → проксирует к `http://localhost:3001/api/v1/characters`
- И т.д.

Это позволяет:
- Скрыть реальный URL Express API от клиента
- Добавить дополнительную логику (кэширование, валидацию)
- Обработать ошибки единообразно

## Загрузка данных

Все страницы используют Server Components и загружают данные на сервере:

- ✅ `/characters` - загружает список персонажей
- ✅ `/characters/[id]` - загружает детальную информацию о персонаже
- ✅ `/lore` - загружает список статей
- ✅ `/lore/[slug]` - загружает детальную статью
- ✅ `/posts` - загружает список постов
- ✅ `/events` - загружает список событий
- ✅ `/discussions` - загружает список обсуждений
- ✅ `/` (главная) - загружает последние посты и события

## Обработка ошибок

Если запрос к API не удался, страница покажет пустой список или 404 (для детальных страниц). В консоли сервера будут логи ошибок.

## Разработка

```bash
# Запуск dev сервера
pnpm dev

# Сборка для продакшена
pnpm build

# Запуск продакшен сервера
pnpm start
```

**Важно:** Убедитесь, что Express API запущен на порту 3001 перед запуском Next.js.
