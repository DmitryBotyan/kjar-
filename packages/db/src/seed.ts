import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import bcrypt from "bcryptjs";

const { Pool } = pg;
import {
  users,
  categories,
  tags,
  articles,
  articleTags,
  characters,
  characterTags,
  posts,
  postTags,
  events,
  eventTags,
  eventParticipants,
  threads,
  threadTags,
  messages,
  polls,
  pollOptions,
  pollVotes
} from "./schema.js";

// Загружаем переменные окружения из .env файла в корне проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../..");
dotenv.config({ path: resolve(rootDir, ".env") });

let connectionString = process.env.DATABASE_URL;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

if (!connectionString) {
  console.error("❌ DATABASE_URL не установлена в переменных окружения");
  process.exit(1);
}

// При локальном запуске (pnpm db:seed) хост "db" недоступен — используем localhost.
// При seed:docker подмена не нужна: внутри контейнера localhost = сам контейнер, БД в "db".
if (process.env.SEED_LOCALHOST === "1" && (connectionString.includes("@db:") || connectionString.includes("@db/"))) {
  // Снаружи БД видна на DB_PORT (внутри сети docker — всегда 5432)
  const hostPort = process.env.DB_PORT || "5433";
  connectionString = connectionString
    .replace(/@db:\d+/g, `@localhost:${hostPort}`)
    .replace(/@db\//g, `@localhost:${hostPort}/`);
  console.log(
    `ℹ️  DATABASE_URL использует localhost:${hostPort} (хост db доступен только в Docker)`
  );
}

const pool = new Pool({
  connectionString
});

const db = drizzle(pool);

async function seed() {
  try {
    console.log("🌱 Начало заполнения базы данных тестовыми данными...");

    // Очистка данных (в обратном порядке зависимостей)
    console.log("🧹 Очистка существующих данных...");
    await db.delete(messages);
    await db.delete(threadTags);
    await db.delete(threads);
    await db.delete(eventParticipants);
    await db.delete(eventTags);
    await db.delete(events);
    await db.delete(postTags);
    await db.delete(posts);
    await db.delete(characterTags);
    await db.delete(characters);
    await db.delete(articleTags);
    await db.delete(articles);
    await db.delete(tags);
    await db.delete(categories);
    await db.delete(users);

    // 1. Создаём пользователей
    console.log("👥 Создание пользователей...");
    const passwordHash = await bcrypt.hash("password123", SALT_ROUNDS);
    
    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@kjar.local",
        username: "admin",
        passwordHash,
        role: "admin"
      })
      .returning();

    const [modUser] = await db
      .insert(users)
      .values({
        email: "mod@kjar.local",
        username: "moderator",
        passwordHash,
        role: "mod"
      })
      .returning();

    const [user1] = await db
      .insert(users)
      .values({
        email: "user1@kjar.local",
        username: "astra_norn",
        passwordHash,
        role: "user"
      })
      .returning();

    const [user2] = await db
      .insert(users)
      .values({
        email: "user2@kjar.local",
        username: "sigrid_vale",
        passwordHash,
        role: "user"
      })
      .returning();

    const [user3] = await db
      .insert(users)
      .values({
        email: "user3@kjar.local",
        username: "lir_kosta",
        passwordHash,
        role: "user"
      })
      .returning();

    console.log(`✅ Создано ${5} пользователей`);

    // 2. Создаём категории
    console.log("📁 Создание категорий...");
    const [categoryGeo] = await db
      .insert(categories)
      .values({
        slug: "geography",
        name: "География",
        description: "Описание локаций, маршрутов и географических особенностей"
      })
      .returning();

    const [categoryHist] = await db
      .insert(categories)
      .values({
        slug: "history",
        name: "История",
        description: "Исторические события и хроники"
      })
      .returning();

    const [categoryCult] = await db
      .insert(categories)
      .values({
        slug: "culture",
        name: "Культура",
        description: "Традиции, ритуалы и культурные особенности"
      })
      .returning();

    const [categoryComm] = await db
      .insert(categories)
      .values({
        slug: "community",
        name: "Сообщество",
        description: "Организации, кланы и сообщества"
      })
      .returning();

    console.log(`✅ Создано ${4} категорий`);

    // 3. Создаём теги
    console.log("🏷️  Создание тегов...");
    const tagData = [
      { slug: "north", name: "Север" },
      { slug: "runes", name: "Руны" },
      { slug: "clans", name: "Кланы" },
      { slug: "fog", name: "Туман" },
      { slug: "rituals", name: "Ритуалы" },
      { slug: "expeditions", name: "Экспедиции" },
      { slug: "navigation", name: "Навигация" },
      { slug: "guardians", name: "Стражи" },
      { slug: "archives", name: "Архив" },
      { slug: "editing", name: "Редактура" }
    ];

    const insertedTags = await db.insert(tags).values(tagData).returning();
    console.log(`✅ Создано ${insertedTags.length} тегов`);

    // 4. Создаём статьи (Articles)
    console.log("📚 Создание статей...");
    const [article1] = await db
      .insert(articles)
      .values({
        slug: "misty-edge",
        title: "Туманная Грань",
        summary: "Ключевая локация северного леса и маршрут, который не видят карты.",
        lead: "Туманная Грань обозначает предел, за которым тропы перестают держать форму.",
        contentMd: `## Описание

Грань появляется в одно и то же время суток, но её положение смещается в зависимости от ветра и влажности.

Считается, что за линией тумана исчезают привычные ориентиры и меняется звучание пространства.

## Маршруты

Основной проход держится на связке старых рун и знаков на коре деревьев.

Для ночных переходов используют связку огней и зеркальные метки.`,
        categoryId: categoryGeo.id,
        era: "Первая",
        factsJson: [
          { label: "Эпоха", value: "Первая" },
          { label: "Ключевые теги", value: "Север, Туманы" }
        ],
        status: "published",
        createdBy: adminUser.id
      })
      .returning();

    const [article2] = await db
      .insert(articles)
      .values({
        slug: "norn-oaths",
        title: "Клятвы Норна",
        summary: "История возникновения клана и ритуалов, связанных с защитой леса.",
        lead: "Клятвы Норна фиксируют договор между кланом и хранителями леса.",
        contentMd: `## Происхождение

Клятвы появились после Великого исхода, когда северные поселения объединились вокруг рунной стражи.

Сохранились записи о трёх ключевых клятвах и их вариациях.

## Ритуалы

Чтение клятв сопровождается рунной линией на земле и кругом из ветвей ели.

Каждый участник оставляет отметку на общем древе памяти.`,
        categoryId: categoryHist.id,
        era: "Вторая",
        factsJson: [
          { label: "Эпоха", value: "Вторая" },
          { label: "Ключевые теги", value: "Кланы, Ритуалы" }
        ],
        status: "published",
        createdBy: modUser.id
      })
      .returning();

    const [article3] = await db
      .insert(articles)
      .values({
        slug: "bark-language",
        title: "Язык коры",
        summary: "Свод рунических символов, их сочетания и правила чтения.",
        lead: "Язык коры фиксирует ключевые смыслы, которые передаются через древесные метки.",
        contentMd: `## Алфавит

Базовый набор включает девять символов, которые отвечают за направление, защиту и память.

Связки символов дают дополнительные оттенки и назначение меток.

## Правила чтения

Символы читаются слева направо, но для обрядовых сочетаний порядок меняется.

В архиве хранится таблица переходов между значениями.`,
        categoryId: categoryCult.id,
        era: "Любая",
        factsJson: [
          { label: "Эпоха", value: "Вне эпох" },
          { label: "Ключевые теги", value: "Руны, Символы" }
        ],
        status: "published",
        createdBy: adminUser.id
      })
      .returning();

    const [articleDraft] = await db
      .insert(articles)
      .values({
        slug: "draft-article",
        title: "Черновик статьи",
        summary: "Эта статья в статусе черновика и доступна только модераторам.",
        lead: "Это тестовая статья в статусе draft.",
        contentMd: "Контент черновика...",
        categoryId: categoryComm.id,
        era: "Первая",
        status: "draft",
        createdBy: modUser.id
      })
      .returning();

    // Связываем статьи с тегами
    await db.insert(articleTags).values([
      { articleId: article1.id, tagId: insertedTags[0].id }, // Север
      { articleId: article1.id, tagId: insertedTags[3].id }, // Туман
      { articleId: article2.id, tagId: insertedTags[2].id }, // Кланы
      { articleId: article2.id, tagId: insertedTags[4].id }, // Ритуалы
      { articleId: article3.id, tagId: insertedTags[1].id }, // Руны
    ]);

    console.log(`✅ Создано ${4} статей`);

    // 5. Создаём персонажей
    console.log("👤 Создание персонажей...");
    const [char1] = await db
      .insert(characters)
      .values({
        slug: "astra-norn",
        name: "Астра Норн",
        role: "Игрок",
        status: "Активна",
        field: "Следопыт туманных троп",
        species: "Человек",
        summary: "Проводник между кланами, слышит шёпот леса и ведёт отряд через густой туман.",
        description: "Астра Норн - опытный следопыт, знающий все тропы северного леса. Она может провести отряд через самые опасные участки, используя древние рунные метки.",
        statsJson: {
          навигация: 85,
          выживание: 90,
          руны: 70
        },
        relationsJson: [
          { type: "Союзник", name: "Сигрид Вейл" },
          { type: "Наставник", name: "Кейр Олмар" }
        ],
        image: null,
        createdBy: user1.id
      })
      .returning();

    const [char2] = await db
      .insert(characters)
      .values({
        slug: "keir-olmar",
        name: "Кейр Олмар",
        role: "НПС",
        status: "На посту",
        field: "Страж пограничных врат",
        species: "Страж",
        summary: "Собирает клятвы у входа в северные земли, хранит древние ключи и предания.",
        description: "Кейр Олмар - страж северных врат, хранитель древних традиций и ритуалов.",
        statsJson: {
          защита: 95,
          знание_ритуалов: 100,
          авторитет: 90
        },
        image: null,
        createdBy: adminUser.id
      })
      .returning();

    const [char3] = await db
      .insert(characters)
      .values({
        slug: "sigrid-vale",
        name: "Сигрид Вейл",
        role: "Игрок",
        status: "В пути",
        field: "Картограф и хроникёр",
        species: "Человек",
        summary: "Помечает каждую тропу на пергаменте, оставляя рунные метки для следующих путников.",
        description: "Сигрид Вейл - талантливый картограф, создающий подробные карты северных троп.",
        statsJson: {
          картография: 95,
          хроники: 85,
          руны: 80
        },
        image: null,
        createdBy: user2.id
      })
      .returning();

    const [char4] = await db
      .insert(characters)
      .values({
        slug: "morvik-reid",
        name: "Морвик Рейд",
        role: "НПС",
        status: "В тени",
        field: "Рунный кузнец",
        species: "Полукровка",
        summary: "Выковывает символы защиты и оружие для стражей, редко выходит из мастерской.",
        description: "Морвик Рейд - мастер по созданию рунических артефактов и защитных символов.",
        statsJson: {
          кузнечное_дело: 100,
          руны: 95,
          защита: 85
        },
        image: null,
        createdBy: adminUser.id
      })
      .returning();

    const [char5] = await db
      .insert(characters)
      .values({
        slug: "lir-kosta",
        name: "Лир Коста",
        role: "Игрок",
        status: "Активен",
        field: "Целитель северных общин",
        species: "Человек",
        summary: "Собирает травы в сумерках и лечит тех, кто вернулся из туманного леса.",
        description: "Лир Коста - опытный целитель, знающий все целебные травы северного леса.",
        statsJson: {
          целительство: 90,
          знание_трав: 95,
          выживание: 75
        },
        image: null,
        createdBy: user3.id
      })
      .returning();

    const [char6] = await db
      .insert(characters)
      .values({
        slug: "eira-hald",
        name: "Эйр Хальд",
        role: "НПС",
        status: "Активна",
        field: "Хранительница архивов",
        species: "Северный род",
        summary: "Следит за древними свитками и пишет заметки о тех, кто приходит просить совета.",
        description: "Эйр Хальд - хранительница древних знаний и архивов северных хроник.",
        statsJson: {
          знание_истории: 100,
          архивы: 95,
          мудрость: 90
        },
        image: null,
        createdBy: adminUser.id
      })
      .returning();

    // Связываем персонажей с тегами
    await db.insert(characterTags).values([
      { characterId: char1.id, tagId: insertedTags[0].id }, // Север
      { characterId: char1.id, tagId: insertedTags[6].id }, // Навигация
      { characterId: char2.id, tagId: insertedTags[7].id }, // Стражи
      { characterId: char2.id, tagId: insertedTags[4].id }, // Ритуалы
      { characterId: char3.id, tagId: insertedTags[6].id }, // Навигация
      { characterId: char4.id, tagId: insertedTags[1].id }, // Руны
    ]);

    console.log(`✅ Создано ${6} персонажей`);

    // 6. Создаём посты
    console.log("📰 Создание постов...");
    const [post1] = await db
      .insert(posts)
      .values({
        slug: "new-expedition-misty-edge",
        title: "Новая экспедиция в Туманную Грань",
        summary: "Отряд разведчиков вернулся с заметками о тропах и первых знаках древних рун.",
        content: `Экспедиция завершилась успешно. Найдены новые рунные метки и уточнены маршруты.

## Основные находки

- Обнаружены три новых рунных символа
- Уточнена карта северных троп
- Задокументированы изменения в тумане

## Следующие шаги

Планируется вторая экспедиция для более детального изучения найденных артефактов.`,
        publishedAt: new Date("2026-01-15"),
        createdBy: adminUser.id
      })
      .returning();

    const [post2] = await db
      .insert(posts)
      .values({
        slug: "north-map-update",
        title: "Обновление карты северных троп",
        summary: "Добавлены новые ориентиры для путников и отмечены небезопасные зоны.",
        content: `Карта северных троп обновлена с учётом последних экспедиций.

Добавлены:
- 5 новых маршрутов
- 12 новых ориентиров
- 3 опасные зоны

Карта доступна в архиве.`,
        publishedAt: new Date("2026-01-20"),
        createdBy: user2.id
      })
      .returning();

    // Связываем посты с тегами
    await db.insert(postTags).values([
      { postId: post1.id, tagId: insertedTags[5].id }, // Экспедиции
      { postId: post1.id, tagId: insertedTags[1].id }, // Руны
      { postId: post2.id, tagId: insertedTags[6].id }, // Навигация
    ]);

    console.log(`✅ Создано ${2} поста`);

    // 6.1. Создаём ивенты (посты с isEvent = true)
    console.log("🎉 Создание ивентов...");
    const [eventPost1] = await db
      .insert(posts)
      .values({
        slug: "new-year-riddle-contest",
        title: "Новогодний конкурс загадок",
        summary: "Разгадайте загадки о северных тропах и выиграйте призы!",
        content: `Добро пожаловать на новогодний конкурс загадок!

## Правила участия

1. Ответьте на все загадки в комментариях к этому посту
2. Первые три правильных ответа получат призы
3. Конкурс продлится до конца недели

## Загадки

1. Что видно днём, но не видно ночью, и что ведёт путника через туман?
2. Какая руна защищает от тумана, но не от холода?
3. Где хранятся древние клятвы северных кланов?

Удачи всем участникам!`,
        publishedAt: new Date("2026-01-10"),
        isEvent: true,
        eventType: "single",
        eventFormat: "riddle",
        participationType: "mass",
        eventConfig: {
          correctAnswers: [
            "Рунные метки",
            "Руна защиты пути",
            "В архиве северных хроник"
          ],
          prizes: ["Рунный артефакт", "Карта троп", "Книга хроник"]
        },
        createdBy: adminUser.id
      })
      .returning();

    const [eventPost2] = await db
      .insert(posts)
      .values({
        slug: "multi-stage-expedition-quest",
        title: "Многоэтапный квест: Путь следопыта",
        summary: "Пройдите все этапы квеста и станьте мастером следопыта!",
        content: `Добро пожаловать на многоэтапный квест "Путь следопыта"!

Этот ивент состоит из нескольких этапов, которые нужно проходить последовательно.

## Как участвовать

1. Зарегистрируйтесь в комментариях к этому посту
2. Выполняйте задания каждого этапа
3. Отправляйте ответы в личные сообщения организатору
4. После прохождения этапа вы получите доступ к следующему

Удачи на пути!`,
        publishedAt: new Date("2026-01-12"),
        isEvent: true,
        eventType: "multi-stage",
        eventFormat: "quest",
        participationType: "individual",
        eventStages: [
          {
            stage: 1,
            title: "Изучение рун",
            content: "Изучите базовые рунные символы и ответьте на вопросы о их значении.",
            tasks: [
              "Назовите три основных руны защиты",
              "Объясните значение связки рун пути и охраны",
              "Опишите, как читаются руны на коре деревьев"
            ]
          },
          {
            stage: 2,
            title: "Картография",
            content: "Создайте карту участка северных троп с указанием всех ориентиров.",
            tasks: [
              "Нанесите на карту минимум 5 ориентиров",
              "Отметьте опасные зоны",
              "Укажите маршруты между ключевыми точками"
            ]
          },
          {
            stage: 3,
            title: "Полевая практика",
            content: "Проведите виртуальную экспедицию и составьте отчёт.",
            tasks: [
              "Опишите маршрут экспедиции",
              "Перечислите найденные артефакты",
              "Составьте отчёт о состоянии троп"
            ]
          }
        ],
        eventConfig: {
          completionReward: "Звание Мастера Следопыта",
          timeLimit: "2 недели на этап"
        },
        createdBy: modUser.id
      })
      .returning();

    const [eventPost3] = await db
      .insert(posts)
      .values({
        slug: "creative-cover-contest",
        title: "Конкурс на обложку хроник",
        summary: "Создайте обложку для новой книги хроник северных троп!",
        content: `Приглашаем всех творческих людей принять участие в конкурсе на обложку!

## Задание

Создайте обложку для книги "Хроники северных троп". Обложка должна отражать атмосферу северного леса, туманов и рунных меток.

## Требования

- Формат: цифровая работа (рисунок, коллаж, графика)
- Размер: 1200x1600 пикселей
- Стиль: в духе северной мифологии и рун

## Как участвовать

1. Создайте обложку
2. Загрузите её в комментарии к этому посту
3. Участники голосуют за лучшую работу

Победитель получит приз и его обложка будет использована для книги!`,
        publishedAt: new Date("2026-01-18"),
        isEvent: true,
        eventType: "single",
        eventFormat: "creative",
        participationType: "mass",
        eventConfig: {
          submissionFormat: "image",
          votingMethod: "community",
          prize: "Использование обложки в книге + рунный артефакт"
        },
        createdBy: adminUser.id
      })
      .returning();

    const [eventPost4] = await db
      .insert(posts)
      .values({
        slug: "poll-favorite-location",
        title: "Опрос: Какая локация вам больше нравится?",
        summary: "Голосуйте за вашу любимую локацию северных земель!",
        content: `Примите участие в опросе и выберите вашу любимую локацию!

## Варианты

1. Туманная Грань
2. Северные врата
3. Архив северных хроник
4. Рунная мастерская
5. Лесные тропы

Голосуйте в комментариях, указав номер вашего выбора!`,
        publishedAt: new Date("2026-01-22"),
        isEvent: true,
        eventType: "single",
        eventFormat: "poll",
        participationType: "mass",
        eventConfig: {
          options: [
            { id: 1, label: "Туманная Грань" },
            { id: 2, label: "Северные врата" },
            { id: 3, label: "Архив северных хроник" },
            { id: 4, label: "Рунная мастерская" },
            { id: 5, label: "Лесные тропы" }
          ],
          votingMethod: "comments"
        },
        createdBy: user1.id
      })
      .returning();

    const [eventPost5] = await db
      .insert(posts)
      .values({
        slug: "word-search-northern-symbols",
        title: "Поиск слов: Северные символы",
        summary: "Найдите все слова, связанные с северными символами и рунами!",
        content: `Добро пожаловать на игру "Поиск слов"!

## Правила

Найдите в сетке все слова, связанные с северными символами и рунами.

## Слова для поиска

- РУНА
- ТУМАН
- СТРАЖ
- КЛЯТВА
- ТРОПА
- АРХИВ
- КАРТА
- СИМВОЛ

Отправьте скриншот с найденными словами в комментарии!`,
        publishedAt: new Date("2026-01-25"),
        isEvent: true,
        eventType: "single",
        eventFormat: "word-search",
        participationType: "individual",
        eventConfig: {
          words: ["РУНА", "ТУМАН", "СТРАЖ", "КЛЯТВА", "ТРОПА", "АРХИВ", "КАРТА", "СИМВОЛ"],
          gridSize: "15x15",
          reward: "Рунный символ в профиле"
        },
        createdBy: modUser.id
      })
      .returning();

    // Связываем ивенты с тегами
    await db.insert(postTags).values([
      { postId: eventPost1.id, tagId: insertedTags[4].id }, // Ритуалы
      { postId: eventPost1.id, tagId: insertedTags[1].id }, // Руны
      { postId: eventPost2.id, tagId: insertedTags[5].id }, // Экспедиции
      { postId: eventPost2.id, tagId: insertedTags[6].id }, // Навигация
      { postId: eventPost3.id, tagId: insertedTags[8].id }, // Архив
      { postId: eventPost4.id, tagId: insertedTags[0].id }, // Север
      { postId: eventPost5.id, tagId: insertedTags[1].id }, // Руны
    ]);

    console.log(`✅ Создано ${5} ивентов`);

    // 6.5. Создаём опрос для ивента с форматом "poll"
    console.log("📊 Создание опроса...");
    const [poll1] = await db
      .insert(polls)
      .values({
        postId: eventPost4.id,
        showPercentages: false,
        isEnded: false,
        allowMultiple: false,
      })
      .returning();

    const pollOptionsData = [
      { pollId: poll1.id, text: "Туманная Грань", order: 0 },
      { pollId: poll1.id, text: "Северные врата", order: 1 },
      { pollId: poll1.id, text: "Архив северных хроник", order: 2 },
      { pollId: poll1.id, text: "Рунная мастерская", order: 3 },
      { pollId: poll1.id, text: "Лесные тропы", order: 4 },
    ];

    const insertedPollOptions = await db
      .insert(pollOptions)
      .values(pollOptionsData)
      .returning();

    // Добавляем несколько тестовых голосов
    await db.insert(pollVotes).values([
      { pollId: poll1.id, optionId: insertedPollOptions[0].id, userId: user1.id }, // Туманная Грань
      { pollId: poll1.id, optionId: insertedPollOptions[1].id, userId: user2.id }, // Северные врата
      { pollId: poll1.id, optionId: insertedPollOptions[2].id, userId: modUser.id }, // Архив северных хроник
      { pollId: poll1.id, optionId: insertedPollOptions[0].id, userId: adminUser.id }, // Туманная Грань
      { pollId: poll1.id, optionId: insertedPollOptions[3].id, characterId: char1.id }, // Рунная мастерская (от персонажа)
    ]);

    console.log(`✅ Создан опрос с ${insertedPollOptions.length} вариантами ответов и 5 голосами`);

    // 7. Создаём события
    console.log("📅 Создание событий...");
    const [event1] = await db
      .insert(events)
      .values({
        slug: "night-oath",
        title: "Ночная клятва",
        summary: "Совместный обряд стражей и хроникёров с ночным переходом по границе тумана.",
        description: "Традиционный обряд, проводимый у северных врат. Участники проходят ритуал клятвы и обновляют защитные руны.",
        status: "Регистрация открыта",
        date: new Date("2026-02-10T20:00:00"),
        dateEnd: new Date("2026-02-11T06:00:00"),
        location: "Северные врата",
        size: "12 мест",
        createdBy: modUser.id
      })
      .returning();

    const [event2] = await db
      .insert(events)
      .values({
        slug: "north-keepers-trail",
        title: "Тропа северных хранителей",
        summary: "Маршрут по старым тропам с проверкой рунических меток и сбором полевых данных.",
        description: "Экспедиция по старым тропам для проверки состояния рунических меток и сбора данных.",
        status: "Подготовка",
        date: new Date("2026-02-18T08:00:00"),
        location: "Туманные тропы",
        size: "8 мест",
        createdBy: adminUser.id
      })
      .returning();

    const [event3] = await db
      .insert(events)
      .values({
        slug: "archive-week",
        title: "Неделя архива",
        summary: "Редакторские сессии: сверяем хроники, выравниваем формат и обновляем источники.",
        description: "Неделя работы над архивами: сверка хроник, обновление форматов и источников.",
        status: "Набор волонтёров",
        date: new Date("2026-02-22T10:00:00"),
        dateEnd: new Date("2026-02-27T18:00:00"),
        location: "Архив северных хроник",
        size: "Открытый набор",
        createdBy: adminUser.id
      })
      .returning();

    // Связываем события с тегами
    await db.insert(eventTags).values([
      { eventId: event1.id, tagId: insertedTags[4].id }, // Ритуалы
      { eventId: event1.id, tagId: insertedTags[7].id }, // Стражи
      { eventId: event2.id, tagId: insertedTags[5].id }, // Экспедиции
      { eventId: event2.id, tagId: insertedTags[6].id }, // Навигация
      { eventId: event3.id, tagId: insertedTags[8].id }, // Архив
      { eventId: event3.id, tagId: insertedTags[9].id }, // Редактура
    ]);

    // Добавляем участников событий
    await db.insert(eventParticipants).values([
      {
        eventId: event1.id,
        userId: user1.id,
        characterId: char1.id,
        role: "Следопыт",
        status: "registered"
      },
      {
        eventId: event1.id,
        userId: user2.id,
        characterId: char3.id,
        role: "Хроникёр",
        status: "confirmed"
      },
      {
        eventId: event2.id,
        userId: user1.id,
        characterId: char1.id,
        role: "Проводник",
        status: "registered"
      },
    ]);

    console.log(`✅ Создано ${3} события`);

    // 8. Создаём обсуждения (Threads)
    console.log("💬 Создание обсуждений...");
    const [thread1] = await db
      .insert(threads)
      .values({
        slug: "rune-marks-interpretation",
        title: "Как трактовать рунические метки?",
        excerpt: "Собираем трактовки и примеры использования рун на картах и артефактах.",
        category: "Лор",
        authorId: user1.id,
        authorName: "Астра Норн",
        isLocked: false,
        isPinned: false
      })
      .returning();

    const [thread2] = await db
      .insert(threads)
      .values({
        slug: "event-roster-next",
        title: "Список персонажей для следующего ивента",
        excerpt: "Нужны следопыты и хроникёры для экспедиции. Оставляйте заявки и роли.",
        category: "Ивенты",
        authorId: user3.id,
        authorName: "Лир Коста",
        isLocked: false,
        isPinned: true
      })
      .returning();

    const [thread3] = await db
      .insert(threads)
      .values({
        slug: "forest-silence-theory",
        title: "Теория о тишине северного леса",
        excerpt: "Почему в тумане исчезают звуки? Делимся дневниками и полевыми заметками.",
        category: "Исследования",
        authorId: adminUser.id,
        authorName: "Морвик Рейд",
        isLocked: false,
        isPinned: false
      })
      .returning();

    // Связываем обсуждения с тегами
    await db.insert(threadTags).values([
      { threadId: thread1.id, tagId: insertedTags[1].id }, // Руны
      { threadId: thread2.id, tagId: insertedTags[5].id }, // Экспедиции
      { threadId: thread3.id, tagId: insertedTags[3].id }, // Туман
    ]);

    // Создаём сообщения в обсуждениях
    await db.insert(messages).values([
      {
        threadId: thread1.id,
        authorId: user1.id,
        authorName: "Астра Норн",
        role: "Автор темы",
        content: "Собрала несколько примеров рун из дневников и карт. Где по-вашему проходит граница между меткой пути и меткой охраны? Делитесь трактовками."
      },
      {
        threadId: thread1.id,
        authorId: user2.id,
        authorName: "Сигрид Вейл",
        role: "Хроникёр",
        content: "В архиве северных троп метки охраны всегда ставят по внутреннему контуру круга. Метки пути обычно идут цепочкой вдоль границы поля."
      },
      {
        threadId: thread1.id,
        authorId: adminUser.id,
        authorName: "Эйр Хальд",
        role: "Хранительница архивов",
        content: "Добавила в архив таблицу по символам. Если нужно, могу открыть доступ к листу и черновым заметкам."
      },
      {
        threadId: thread2.id,
        authorId: user3.id,
        authorName: "Лир Коста",
        role: "Автор темы",
        content: "Готовим состав для экспедиции в Туманную Грань. Нужны следопыты, картограф и один хранитель рун."
      },
      {
        threadId: thread2.id,
        authorId: adminUser.id,
        authorName: "Кейр Олмар",
        role: "Модератор",
        content: "Подтверждаю требования. Добавляйте краткий листинг навыков и доступность по датам."
      },
      {
        threadId: thread3.id,
        authorId: adminUser.id,
        authorName: "Морвик Рейд",
        role: "Автор темы",
        content: "Предполагаю, что тишина связана с полем старых ритуалов. В тех же местах металл начинает тускнеть быстрее обычного."
      },
    ]);

    console.log(`✅ Создано ${3} обсуждения с ${6} сообщениями`);

    console.log("\n✅ База данных успешно заполнена тестовыми данными!");
    console.log("\n📋 Сводка:");
    console.log(`   - Пользователей: 5 (1 admin, 1 mod, 3 user)`);
    console.log(`   - Категорий: 4`);
    console.log(`   - Тегов: ${insertedTags.length}`);
    console.log(`   - Статей: 4 (3 published, 1 draft)`);
    console.log(`   - Персонажей: 6`);
    console.log(`   - Постов: 2`);
    console.log(`   - Ивентов (постов-ивентов): 5`);
    console.log(`   - Событий: 3`);
    console.log(`   - Обсуждений: 3`);
    console.log(`   - Сообщений: 6`);
    console.log("\n🔑 Тестовые учетные данные:");
    console.log(`   - admin@kjar.local / password123 (роль: admin)`);
    console.log(`   - mod@kjar.local / password123 (роль: mod)`);
    console.log(`   - user1@kjar.local / password123 (роль: user)`);
    console.log(`   - user2@kjar.local / password123 (роль: user)`);
    console.log(`   - user3@kjar.local / password123 (роль: user)`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при заполнении базы данных:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
