import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
  boolean,
  index,
  unique
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ===== Users =====
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    // E-mail не храним: вход по логину, персональных данных в базе нет
    username: varchar("username", { length: 100 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 24 }).notNull().default("user"), // guest, user, mod, admin
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    usernameIdx: index("users_username_idx").on(table.username),
    roleIdx: index("users_role_idx").on(table.role)
  })
);

// ===== Categories =====
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// ===== Tags =====
export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    slugIdx: index("tags_slug_idx").on(table.slug)
  })
);

// ===== Articles (Lore) =====
export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary"),
    lead: text("lead"), // Вступление/лид
    contentMd: text("content_md"), // Markdown контент
    categoryId: integer("category_id").references(() => categories.id),
    era: varchar("era", { length: 64 }), // Первая, Вторая, Любая, Вне эпох
    factsJson: jsonb("facts_json"), // [{label: string, value: string}]
    status: varchar("status", { length: 32 }).notNull().default("draft"), // draft, published, archived
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    slugIdx: index("articles_slug_idx").on(table.slug),
    categoryIdx: index("articles_category_idx").on(table.categoryId),
    statusIdx: index("articles_status_idx").on(table.status),
    eraIdx: index("articles_era_idx").on(table.era),
    updatedAtIdx: index("articles_updated_at_idx").on(table.updatedAt)
  })
);

// ===== Article Tags (many-to-many) =====
export const articleTags = pgTable(
  "article_tags",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: unique("article_tags_pk").on(table.articleId, table.tagId),
    articleIdx: index("article_tags_article_idx").on(table.articleId),
    tagIdx: index("article_tags_tag_idx").on(table.tagId)
  })
);

// ===== Characters =====
export const characters = pgTable(
  "characters",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    role: varchar("role", { length: 50 }).notNull(), // Игрок, НПС
    status: varchar("status", { length: 50 }).notNull(), // Активна, На посту, В пути, В тени, Активен
    field: varchar("field", { length: 200 }), // Поле деятельности
    species: varchar("species", { length: 100 }), // Человек, Страж, Полукровка, Северный род
    summary: text("summary"),
    description: text("description"), // Полное описание
    statsJson: jsonb("stats_json"), // Статистика персонажа
    relationsJson: jsonb("relations_json"), // Связи с другими персонажами
    image: varchar("image", { length: 500 }), // Путь к изображению
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    slugIdx: index("characters_slug_idx").on(table.slug),
    roleIdx: index("characters_role_idx").on(table.role),
    statusIdx: index("characters_status_idx").on(table.status),
    speciesIdx: index("characters_species_idx").on(table.species)
  })
);

// ===== Character Tags (many-to-many) =====
export const characterTags = pgTable(
  "character_tags",
  {
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: unique("character_tags_pk").on(table.characterId, table.tagId),
    characterIdx: index("character_tags_character_idx").on(table.characterId),
    tagIdx: index("character_tags_tag_idx").on(table.tagId)
  })
);

// ===== Posts =====
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    summary: text("summary"),
    content: text("content"), // Markdown или HTML
    image: varchar("image", { length: 500 }), // Путь к изображению в S3
    publishedAt: timestamp("published_at"),
    // Поля для ивентов (особый вид постов)
    isEvent: boolean("is_event").notNull().default(false), // Флаг, что это ивент
    eventType: varchar("event_type", { length: 50 }), // single, multi-stage
    eventFormat: varchar("event_format", { length: 100 }), // poll, riddle, puzzle, crossword, quest, creative, choice, word-search, image-search
    participationType: varchar("participation_type", { length: 50 }), // individual, mass
    eventStages: jsonb("event_stages"), // [{stage: number, title: string, content: string, tasks: []}] для многоэтапных
    eventConfig: jsonb("event_config"), // Конфигурация ивента (варианты ответов, правильные ответы, настройки и т.д.)
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    slugIdx: index("posts_slug_idx").on(table.slug),
    publishedAtIdx: index("posts_published_at_idx").on(table.publishedAt),
    createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
    isEventIdx: index("posts_is_event_idx").on(table.isEvent),
    eventTypeIdx: index("posts_event_type_idx").on(table.eventType),
    eventFormatIdx: index("posts_event_format_idx").on(table.eventFormat)
  })
);

// ===== Post Tags (many-to-many) =====
export const postTags = pgTable(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: unique("post_tags_pk").on(table.postId, table.tagId),
    postIdx: index("post_tags_post_idx").on(table.postId),
    tagIdx: index("post_tags_tag_idx").on(table.tagId)
  })
);

// ===== Events =====
// Не используется: ивенты живут в posts с флагом isEvent, API к этой таблице
// не обращается. Осталась от прежней схемы, вместе с event_tags и
// event_participants. Удалять отдельной миграцией, когда решим, что участники
// ивентов точно не понадобятся в этом виде.
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    summary: text("summary"),
    description: text("description"),
    status: varchar("status", { length: 100 }).notNull(), // Регистрация открыта, Подготовка, Скоро, Архив
    date: timestamp("date"),
    dateEnd: timestamp("date_end"), // Для событий с диапазоном дат
    location: varchar("location", { length: 200 }),
    size: varchar("size", { length: 100 }), // Количество мест или "Открытый набор"
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    slugIdx: index("events_slug_idx").on(table.slug),
    statusIdx: index("events_status_idx").on(table.status),
    dateIdx: index("events_date_idx").on(table.date)
  })
);

// ===== Event Tags (many-to-many) =====
export const eventTags = pgTable(
  "event_tags",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: unique("event_tags_pk").on(table.eventId, table.tagId),
    eventIdx: index("event_tags_event_idx").on(table.eventId),
    tagIdx: index("event_tags_tag_idx").on(table.tagId)
  })
);

// ===== Event Participants =====
export const eventParticipants = pgTable(
  "event_participants",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("character_id").references(() => characters.id, {
      onDelete: "cascade"
    }),
    role: varchar("role", { length: 100 }), // Роль в событии
    status: varchar("status", { length: 50 }).notNull().default("registered"), // registered, confirmed, cancelled
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    eventIdx: index("event_participants_event_idx").on(table.eventId),
    userIdx: index("event_participants_user_idx").on(table.userId),
    characterIdx: index("event_participants_character_idx").on(table.characterId)
  })
);

// ===== Polls (для ивентов с форматом "poll") =====
export const polls = pgTable(
  "polls",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" })
      .unique(), // Один опрос на один пост
    showPercentages: boolean("show_percentages").notNull().default(false), // Показывать ли проценты
    isEnded: boolean("is_ended").notNull().default(false), // Завершен ли опрос
    allowMultiple: boolean("allow_multiple").notNull().default(false), // Разрешено ли выбирать несколько вариантов
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    postIdx: index("polls_post_idx").on(table.postId)
  })
);

// ===== Poll Options (варианты ответов в опросе) =====
export const pollOptions = pgTable(
  "poll_options",
  {
    id: serial("id").primaryKey(),
    pollId: integer("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    text: text("text").notNull(), // Текст варианта ответа
    order: integer("order").notNull().default(0), // Порядок отображения
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    pollIdx: index("poll_options_poll_idx").on(table.pollId)
  })
);

// ===== Poll Votes (голоса пользователей) =====
export const pollVotes = pgTable(
  "poll_votes",
  {
    id: serial("id").primaryKey(),
    pollId: integer("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: integer("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("character_id").references(() => characters.id, {
      onDelete: "cascade"
    }),
    // Гостевой голос: браузер хранит случайный ключ, входа для опроса не требуется
    voterKey: varchar("voter_key", { length: 64 }),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    pollIdx: index("poll_votes_poll_idx").on(table.pollId),
    optionIdx: index("poll_votes_option_idx").on(table.optionId),
    userIdx: index("poll_votes_user_idx").on(table.userId),
    characterIdx: index("poll_votes_character_idx").on(table.characterId),
    // Уникальный индекс: один пользователь/персонаж может проголосовать один раз в опросе
    // (если allowMultiple = false, то только за один вариант)
    uniqueUserPoll: unique("poll_votes_user_poll_unique").on(table.pollId, table.userId),
    uniqueCharacterPoll: unique("poll_votes_character_poll_unique").on(table.pollId, table.characterId),
    uniqueVoterPoll: unique("poll_votes_voter_poll_unique").on(table.pollId, table.voterKey)
  })
);

// ===== Threads (Discussions) =====
export const threads = pgTable(
  "threads",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    excerpt: text("excerpt"), // Краткое описание
    category: varchar("category", { length: 100 }), // Лор, Ивенты, Исследования, Сообщество, Ритуалы, Редактура
    authorId: integer("author_id").references(() => users.id),
    authorName: varchar("author_name", { length: 200 }), // Имя автора (может быть из персонажа)
    isLocked: boolean("is_locked").notNull().default(false),
    isPinned: boolean("is_pinned").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    slugIdx: index("threads_slug_idx").on(table.slug),
    categoryIdx: index("threads_category_idx").on(table.category),
    authorIdx: index("threads_author_idx").on(table.authorId),
    updatedAtIdx: index("threads_updated_at_idx").on(table.updatedAt)
  })
);

// ===== Thread Tags (many-to-many) =====
export const threadTags = pgTable(
  "thread_tags",
  {
    threadId: integer("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: unique("thread_tags_pk").on(table.threadId, table.tagId),
    threadIdx: index("thread_tags_thread_idx").on(table.threadId),
    tagIdx: index("thread_tags_tag_idx").on(table.tagId)
  })
);

// ===== Messages (Thread Posts) =====
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    authorId: integer("author_id").references(() => users.id),
    authorName: varchar("author_name", { length: 200 }).notNull(), // Имя автора
    role: varchar("role", { length: 100 }), // Автор темы, Хроникёр, Модератор, Участник, Редактор, Кузнец рун
    content: text("content").notNull(),
    isEdited: boolean("is_edited").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    threadIdx: index("messages_thread_idx").on(table.threadId),
    authorIdx: index("messages_author_idx").on(table.authorId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt)
  })
);

// ===== Related Materials (связи между сущностями) =====
// Не используется: связи между статьями и персонажами пока нигде не строятся.
export const relatedMaterials = pgTable(
  "related_materials",
  {
    id: serial("id").primaryKey(),
    sourceType: varchar("source_type", { length: 50 }).notNull(), // article, character, event, thread, post
    sourceId: integer("source_id").notNull(),
    targetType: varchar("target_type", { length: 50 }).notNull(), // article, character, event, thread, post
    targetId: integer("target_id").notNull(),
    relationType: varchar("relation_type", { length: 100 }), // related, mentioned, participant, etc.
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    sourceIdx: index("related_materials_source_idx").on(
      table.sourceType,
      table.sourceId
    ),
    targetIdx: index("related_materials_target_idx").on(
      table.targetType,
      table.targetId
    )
  })
);

// ===== Comments (для постов, статей, ивентов) =====
export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    targetType: varchar("target_type", { length: 50 }).notNull(), // post, event, article
    targetId: integer("target_id").notNull(), // ID поста/ивента/статьи
    authorName: varchar("author_name", { length: 100 }).notNull(), // Никнейм автора
    content: text("content").notNull(), // Текст комментария
    image: varchar("image", { length: 500 }), // URL изображения (S3)
    parentId: integer("parent_id").references((): any => comments.id, { onDelete: "cascade" }), // Для ответов на комментарии
    isApproved: boolean("is_approved").notNull().default(true), // Модерация (по умолчанию одобрен)
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    targetIdx: index("comments_target_idx").on(table.targetType, table.targetId),
    parentIdx: index("comments_parent_idx").on(table.parentId),
    createdAtIdx: index("comments_created_at_idx").on(table.createdAt)
  })
);

// ===== Contact Requests (форма на странице контактов) =====
export const contactRequests = pgTable(
  "contact_requests",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    // Канал для ответа: почта или мессенджер, заполняет сам отправитель
    contact: varchar("contact", { length: 200 }).notNull(),
    subject: varchar("subject", { length: 300 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 24 }).notNull().default("new"), // new, in_progress, done
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    statusIdx: index("contact_requests_status_idx").on(table.status),
    createdAtIdx: index("contact_requests_created_at_idx").on(table.createdAt)
  })
);

// ===== Relations (Drizzle relations для удобных запросов) =====
export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  characters: many(characters),
  posts: many(posts),
  events: many(events),
  threads: many(threads),
  messages: many(messages),
  eventParticipants: many(eventParticipants)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles)
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id]
  }),
  creator: one(users, {
    fields: [articles.createdBy],
    references: [users.id]
  }),
  articleTags: many(articleTags)
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
  characterTags: many(characterTags),
  postTags: many(postTags),
  eventTags: many(eventTags),
  threadTags: many(threadTags)
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id]
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id]
  })
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  creator: one(users, {
    fields: [characters.createdBy],
    references: [users.id]
  }),
  characterTags: many(characterTags),
  eventParticipants: many(eventParticipants)
}));

export const characterTagsRelations = relations(characterTags, ({ one }) => ({
  character: one(characters, {
    fields: [characterTags.characterId],
    references: [characters.id]
  }),
  tag: one(tags, {
    fields: [characterTags.tagId],
    references: [tags.id]
  })
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  creator: one(users, {
    fields: [posts.createdBy],
    references: [users.id]
  }),
  postTags: many(postTags),
  poll: one(polls, {
    fields: [posts.id],
    references: [polls.postId]
  })
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id]
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id]
  })
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id]
  }),
  eventTags: many(eventTags),
  participants: many(eventParticipants)
}));

export const eventTagsRelations = relations(eventTags, ({ one }) => ({
  event: one(events, {
    fields: [eventTags.eventId],
    references: [events.id]
  }),
  tag: one(tags, {
    fields: [eventTags.tagId],
    references: [tags.id]
  })
}));

export const eventParticipantsRelations = relations(
  eventParticipants,
  ({ one }) => ({
    event: one(events, {
      fields: [eventParticipants.eventId],
      references: [events.id]
    }),
    user: one(users, {
      fields: [eventParticipants.userId],
      references: [users.id]
    }),
    character: one(characters, {
      fields: [eventParticipants.characterId],
      references: [characters.id]
    })
  })
);

export const threadsRelations = relations(threads, ({ one, many }) => ({
  author: one(users, {
    fields: [threads.authorId],
    references: [users.id]
  }),
  threadTags: many(threadTags),
  messages: many(messages)
}));

export const threadTagsRelations = relations(threadTags, ({ one }) => ({
  thread: one(threads, {
    fields: [threadTags.threadId],
    references: [threads.id]
  }),
  tag: one(tags, {
    fields: [threadTags.tagId],
    references: [tags.id]
  })
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id]
  }),
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id]
  })
}));

// ===== Poll Relations =====
export const pollsRelations = relations(polls, ({ one, many }) => ({
  post: one(posts, {
    fields: [polls.postId],
    references: [posts.id]
  }),
  options: many(pollOptions),
  votes: many(pollVotes)
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id]
  }),
  votes: many(pollVotes)
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  poll: one(polls, {
    fields: [pollVotes.pollId],
    references: [polls.id]
  }),
  option: one(pollOptions, {
    fields: [pollVotes.optionId],
    references: [pollOptions.id]
  }),
  user: one(users, {
    fields: [pollVotes.userId],
    references: [users.id]
  }),
  character: one(characters, {
    fields: [pollVotes.characterId],
    references: [characters.id]
  })
}));

// ===== Comments Relations =====
export const commentsRelations = relations(comments, ({ one, many }) => ({
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies"
  }),
  replies: many(comments, {
    relationName: "commentReplies"
  })
}));
