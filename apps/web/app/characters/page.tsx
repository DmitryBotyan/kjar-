import Link from "next/link";
import CharacterCard from "@/components/CharacterCard";
import { getCharacters, getTags } from "@/lib/api";
import { getDictionarySet } from "@/lib/dictionaries";
import type { DictionaryEntry } from "@/lib/dictionaries";

interface CharactersPageProps {
  searchParams: {
    role?: string;
    status?: string;
    species?: string;
    tag?: string;
    search?: string;
    limit?: string;
    offset?: string;
  };
}

export default async function CharactersPage({ searchParams }: CharactersPageProps) {
  let characters: any[] = [];
  let tags: any[] = [];
  let roles: DictionaryEntry[] = [];
  let species: DictionaryEntry[] = [];
  let statuses: DictionaryEntry[] = [];
  let total = 0;

  try {
    const [charactersRes, tagsRes, dictionaries] = await Promise.all([
      getCharacters({
        role: searchParams.role,
        status: searchParams.status,
        species: searchParams.species,
        tag: searchParams.tag,
        search: searchParams.search,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0
      }),
      getTags().catch(() => ({ data: [] })),
      getDictionarySet()
    ]);

    characters = charactersRes.data || [];
    total = charactersRes.total || characters.length;
    tags = tagsRes.data || [];

    roles = dictionaries.character_role;
    species = dictionaries.character_species;
    statuses = dictionaries.character_status;
  } catch (error) {
    console.error("Error loading characters:", error);
  }

  // Сводка: по каждой роли из справочника — сколько карт в текущей выборке
  const byRole = roles.map((role) => ({
    role: role.label,
    count: characters.filter((c: any) => c.role === role.code).length
  }));

  const stats = { total: total || characters.length, byRole };

  return (
    <div className="kjar-characters">
      <section className="kjar-characters__hero">
        <div className="kjar-characters__inner kjar-characters__hero-grid">
          <header className="kjar-characters__header">
            <h1 className="kjar-characters__title">Колода кьяров</h1>
            <p className="kjar-characters__lead">
              Каждая карта — человек, страж или тот, кого лес пустил обратно. Роль,
              род, поле деятельности и короткая заметка: достаточно, чтобы собрать
              состав на сюжет.
            </p>
            {roles.length > 0 && (
              <div className="kjar-characters__chips">
                {roles.map((role) => (
                  <Link
                    className={`kjar-chip${
                      searchParams.role === role.code ? " kjar-chip--accent" : ""
                    }`}
                    key={role.code}
                    href={`/characters?role=${encodeURIComponent(role.code)}`}
                  >
                    {role.label}
                  </Link>
                ))}
              </div>
            )}
          </header>

          <div className="kjar-characters__summary" aria-label="Сводка колоды">
            <h2 className="kjar-characters__summary-title">Сводка</h2>
            <ul className="kjar-characters__summary-list">
              <li className="kjar-characters__summary-item">
                <span>Всего карт</span>
                <span className="kjar-characters__summary-value">{stats.total}</span>
              </li>
              {stats.byRole.map((row) => (
                <li className="kjar-characters__summary-item" key={row.role}>
                  <span>{row.role}</span>
                  <span className="kjar-characters__summary-value">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="kjar-characters__body">
        <div className="kjar-characters__inner kjar-characters__layout">
          <aside className="kjar-characters__filters" aria-label="Фильтры кьяров">
            <h2 className="kjar-characters__section-title">Фильтры</h2>
            <form className="kjar-characters__form" method="get" action="/characters">
              <div className="kjar-field">
                <label className="kjar-label" htmlFor="character-search">
                  Поиск
                </label>
                <input
                  className="kjar-input"
                  id="character-search"
                  name="search"
                  type="search"
                  defaultValue={searchParams.search || ""}
                  placeholder="Имя, род, занятие"
                />
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="character-role">
                  Роль
                </label>
                <select
                  className="kjar-select"
                  id="character-role"
                  name="role"
                  defaultValue={searchParams.role || ""}
                >
                  <option value="">Все роли</option>
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="character-species">
                  Род
                </label>
                <select
                  className="kjar-select"
                  id="character-species"
                  name="species"
                  defaultValue={searchParams.species || ""}
                >
                  <option value="">Любой род</option>
                  {species.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="character-status">
                  Статус
                </label>
                <select
                  className="kjar-select"
                  id="character-status"
                  name="status"
                  defaultValue={searchParams.status || ""}
                >
                  <option value="">Любой статус</option>
                  {statuses.map((status) => (
                    <option key={status.code} value={status.code}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {tags.length > 0 && (
                <div className="kjar-field">
                  <label className="kjar-label" htmlFor="character-tag">
                    Тег
                  </label>
                  <select
                    className="kjar-select"
                    id="character-tag"
                    name="tag"
                    defaultValue={searchParams.tag || ""}
                  >
                    <option value="">Все теги</option>
                    {tags.map((tag: any) => (
                      <option key={tag.id || tag.slug} value={tag.slug}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="kjar-form-actions">
                <button className="kjar-button kjar-button--primary" type="submit">
                  Применить
                </button>
                <Link className="kjar-button kjar-button--ghost" href="/characters">
                  Сбросить
                </Link>
              </div>
            </form>
          </aside>

          <section className="kjar-characters__list" aria-label="Список кьяров">
            <div className="kjar-characters__list-head">
              <div>
                <h2 className="kjar-characters__section-title">Карты</h2>
                <p className="kjar-characters__section-subtitle">
                  Показано {characters.length} из {stats.total}
                </p>
              </div>
            </div>

            {characters.length === 0 ? (
              <div className="kjar-empty">
                <p>По этим фильтрам карт нет. Попробуйте снять часть условий.</p>
              </div>
            ) : (
              <ul className="kjar-characters__grid">
                {characters.map((character: any) => (
                  <li key={character.id || character.slug}>
                    <CharacterCard character={character} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
