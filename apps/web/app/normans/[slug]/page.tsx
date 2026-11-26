import Link from "next/link";
import { notFound } from "next/navigation";
import { getNormanBySlug } from "@/lib/api";
import CharacterCard from "@/components/CharacterCard";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { getDictionarySet, labelFor } from "@/lib/dictionaries";
import type { DictionarySet } from "@/lib/dictionaries";

const TRAIT_MAX = 10;

type NormanPageProps = {
  params: { slug: string };
};

export default async function NormanPage({ params }: NormanPageProps) {
  const [norman, dictionaries] = await Promise.all([
    getNormanBySlug(params.slug)
      .then((response) => response.data)
      .catch(() => null),
    getDictionarySet().catch((): DictionarySet | null => null)
  ]);

  if (!norman) notFound();

  const kjars = norman.kjars || [];

  const facts = [
    ["Тип", labelFor(dictionaries?.norman_type, norman.normanType)],
    ["Пол", labelFor(dictionaries?.norman_gender, norman.gender)],
    ["Род деятельности", labelFor(dictionaries?.norman_occupation, norman.occupation)]
  ].filter((row): row is [string, string] => Boolean(row[1]));

  // Шкалы идут в порядке справочника, шкала вне справочника встаёт в конец
  const traitOrder = (dictionaries?.norman_trait || []).map((entry) => entry.code);
  const traits = Object.entries(norman.traitsJson || {})
    .filter(([, value]) => typeof value === "number")
    .sort(([a], [b]) => {
      const rank = (key: string) =>
        traitOrder.includes(key) ? traitOrder.indexOf(key) : traitOrder.length;
      return rank(a) - rank(b);
    });

  return (
    <div className="kjar-character">
      <section className="kjar-character__hero">
        <div className="kjar-character__inner">
          <nav className="kjar-character__breadcrumbs" aria-label="Хлебные крошки">
            <ol>
              <li>
                <Link href="/normans">Норманны</Link>
              </li>
              <li>{norman.name}</li>
            </ol>
          </nav>

          <div className="kjar-norman">
            {norman.image && (
              <img className="kjar-norman__image" src={norman.image} alt={norman.name} />
            )}
            <div className="kjar-character__intro">
              <h1 className="kjar-character__title">{norman.name}</h1>
              {norman.summary && <p className="kjar-character__tagline">{norman.summary}</p>}
              {facts.length > 0 && (
                <ul className="kjar-character__stats">
                  {facts.map(([label, value]) => (
                    <li className="kjar-character__stat" key={label}>
                      <span className="kjar-character__stat-label">{label}</span>
                      <span className="kjar-character__stat-value">{value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="kjar-character__body">
        <div className="kjar-character__inner">
          {traits.length > 0 && (
            <section className="kjar-character__section" aria-label="Мини-анкета">
              <h2 className="kjar-section__title">Мини-анкета</h2>
              <ul className="kjar-character__meters">
                {traits.map(([label, value]) => (
                  <li className="kjar-meter" key={label}>
                    <div className="kjar-meter__head">
                      <span className="kjar-meter__label">
                        {labelFor(dictionaries?.norman_trait, label)}
                      </span>
                      <span className="kjar-meter__value">
                        {value}
                        <span className="kjar-meter__max"> / {TRAIT_MAX}</span>
                      </span>
                    </div>
                    <div
                      className="kjar-meter__track"
                      role="meter"
                      aria-label={label}
                      aria-valuenow={value}
                      aria-valuemin={0}
                      aria-valuemax={TRAIT_MAX}
                    >
                      <span
                        className="kjar-meter__fill"
                        style={{ width: `${Math.max(2, (value / TRAIT_MAX) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {norman.description && (
            <section className="kjar-character__section">
              <h2 className="kjar-section__title">О норманне</h2>
              <div className="kjar-markdown kjar-markdown--plain">
                <MarkdownRenderer content={norman.description} variant="ref" />
              </div>
            </section>
          )}

          <section className="kjar-character__section">
            <h2 className="kjar-section__title">Кьяры</h2>
            {kjars.length === 0 ? (
              <div className="kjar-empty">
                <p>Своих кьяров пока нет.</p>
              </div>
            ) : (
              <ul className="kjar-characters__grid">
                {kjars.map((kjar) => (
                  <li key={kjar.id}>
                    <CharacterCard character={kjar} />
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
