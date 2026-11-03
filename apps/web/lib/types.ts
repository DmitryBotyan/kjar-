// Ответы API в том виде, в каком они приходят по сети: даты строками,
// jsonb-поля без гарантий формы, поэтому unknown там, где админка пишет что угодно

export interface Tag {
  id: number;
  slug: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Fact {
  label: string;
  value: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  lead: string | null;
  categoryId: number | null;
  era: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  category: Category | null;
  // Только в ответе на один материал
  contentMd?: string | null;
  factsJson?: Fact[] | null;
  tags?: Tag[];
}

export interface Norman {
  id: number;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  // В списке: сколько кьяров у норманна
  kjarCount?: number;
  // Только в ответе на одного норманна
  kjars?: Array<Pick<Character, "id" | "slug" | "name" | "species" | "summary" | "image" | "statsJson">>;
}

export interface Kin {
  kind: string;
  name: string;
  slug: string | null;
}

export interface KinCard {
  slug: string;
  name: string;
  image: string | null;
  statsJson: unknown;
}

export interface CharacterWork {
  id: number;
  authorName: string;
  title: string | null;
  image: string;
  createdAt: string;
}

export interface Character {
  id: number;
  slug: string;
  name: string;
  role: string;
  status: string;
  field: string | null;
  species: string | null;
  summary: string | null;
  statsJson: unknown;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  // Только в ответе на одного кьяра
  description?: string | null;
  relationsJson?: Kin[];
  tjornId?: number | null;
  favorite?: string | null;
  features?: string | null;
  achievementsJson?: unknown;
  kin?: Array<Kin & { card: KinCard | null }>;
  tjorn?: Pick<Norman, "slug" | "name" | "image"> | null;
  works?: CharacterWork[];
  tags?: Tag[];
}

export interface EventStage {
  stage: number;
  title: string;
  content: string;
  tasks: string[];
}

// Ивент это пост с isEvent: одна таблица, один тип
export interface Post {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content?: string | null;
  image: string | null;
  publishedAt: string | null;
  isEvent: boolean;
  eventType: string | null;
  eventFormat: string | null;
  participationType: string | null;
  eventStages: EventStage[] | null;
  eventConfig: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface ThreadMessage {
  id: number;
  threadId: number;
  authorId: number | null;
  authorName: string;
  role: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  authorName: string;
  isLocked: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  // Только в ответе на одно обсуждение
  authorId?: number | null;
  tags?: Tag[];
  messages?: ThreadMessage[];
}
