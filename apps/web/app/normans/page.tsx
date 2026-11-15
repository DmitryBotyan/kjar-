import Link from "next/link";
import { getNormans } from "@/lib/api";
import { getDictionarySet, labelFor } from "@/lib/dictionaries";
import type { DictionaryEntry, DictionarySet } from "@/lib/dictionaries";
import { plural } from "@/lib/plural";
import type { Norman } from "@/lib/types";

export const metadata = {
  title: "Норманны — KJÁR"
};

type NormansPageProps = {
  searchParams: {
    search?: string;
    gender?: string;
    occupation?: string;
    type?: string;
  };
};

function FilterSelect({
  id,
  name,
  label,
  empty,
  entries,
  value
}: {
  id: string;
  name: string;
  label: string;
  empty: string;
  entries: DictionaryEntry[];
  value?: string;
}) {
  return (
    <div className="kjar-field">
      <label className="kjar-label" htmlFor={id}>
        {label}
      </label>
      <select className="kjar-select" id={id} name={name} defaultValue={value || ""}>
        <option value="">{empty}</option>
        {entries.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default async function NormansPage({ searchParams }: NormansPageProps) {
  const [normans, dictionaries] = await Promise.all([
    getNormans(searchParams)
      .then((response) => response.data || [])
      .catch((): Norman[] => []),
    getDictionarySet().catch((): DictionarySet | null => null)
  ]);

  const filtered = Boolean(
    searchParams.search || searchParams.gender || searchParams.occupation || searchParams.type
  );

  return (
    <div className="kjar-characters">
      <section className="kjar-characters__hero">
        <div className="kjar-characters__inner">
          <header className="kjar-characters__header">
            <h1 className="kjar-characters__title">Норманны</h1>
            <p className="kjar-characters__lead">
              Жители Хеймсвальда, имеющие и не имеющие своих божественных спутников.
            </p>
          </header>
        </div>
      </section>

      <section className="kjar-characters__body">
        <div className="kjar-characters__inner kjar-characters__layout">
          <aside className="kjar-characters__filters" aria-label="Фильтры норманнов">
            <h2 className="kjar-characters__section-title">Фильтры</h2>
            <form className="kjar-characters__form" method="get" action="/normans">
              <div className="kjar-field">
                <label className="kjar-label" htmlFor="norman-search">
                  Поиск
                </label>
                <input
                  className="kjar-input"
                  id="norman-search"
                  name="search"
                  type="search"
                  defaultValue={searchParams.search || ""}
                  placeholder="Имя, пол, род деятельности"
                />
              </div>

              <FilterSelect
                id="norman-gender"
                name="gender"
                label="Пол"
                empty="Любой"
                entries={dictionaries?.norman_gender || []}
                value={searchParams.gender}
              />
              <FilterSelect
                id="norman-occupation"
                name="occupation"
                label="Род деятельности"
                empty="Любой"
                entries={dictionaries?.norman_occupation || []}
                value={searchParams.occupation}
              />
              <FilterSelect
                id="norman-type"
                name="type"
                label="Тип"
                empty="Все типы"
                entries={dictionaries?.norman_type || []}
                value={searchParams.type}
              />

              <div className="kjar-form-actions">
                <button className="kjar-button kjar-button--primary" type="submit">
                  Применить
                </button>
                <Link className="kjar-button kjar-button--ghost" href="/normans">
                  Сбросить
                </Link>
              </div>
            </form>
          </aside>

          <section className="kjar-characters__list" aria-label="Список норманнов">
            {normans.length === 0 ? (
              <div className="kjar-empty">
                <p>
                  {filtered
                    ? "По этим фильтрам никого нет. Попробуйте снять часть условий."
                    : "Норманнов пока нет."}
                </p>
              </div>
            ) : (
              <ul className="kjar-normans">
                {normans.map((norman) => {
                  const meta = [
                    labelFor(dictionaries?.norman_type, norman.normanType),
                    labelFor(dictionaries?.norman_occupation, norman.occupation),
                    labelFor(dictionaries?.norman_gender, norman.gender)
                  ].filter(Boolean);

                  return (
                    <li key={norman.id}>
                      <Link className="kjar-norman-card" href={`/normans/${norman.slug}`}>
                        <span className="kjar-norman-card__image">
                          {norman.image ? (
                            <img src={norman.image} alt="" loading="lazy" />
                          ) : (
                            <span />
                          )}
                        </span>
                        <span className="kjar-norman-card__body">
                          <span className="kjar-norman-card__name">{norman.name}</span>
                          {meta.length > 0 && (
                            <span className="kjar-norman-card__meta">{meta.join(" · ")}</span>
                          )}
                          {norman.summary && (
                            <span className="kjar-norman-card__summary">{norman.summary}</span>
                          )}
                          <span className="kjar-norman-card__count">
                            {norman.kjarCount ?? 0} {plural(norman.kjarCount ?? 0, ["кьяр", "кьяра", "кьяров"])}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
