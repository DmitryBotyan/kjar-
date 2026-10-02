import Link from "next/link";
import { notFound } from "next/navigation";
import { getNormanBySlug } from "@/lib/api";
import CharacterCard from "@/components/CharacterCard";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type NormanPageProps = {
  params: { slug: string };
};

export default async function NormanPage({ params }: NormanPageProps) {
  const norman = await getNormanBySlug(params.slug)
    .then((response) => response.data)
    .catch(() => null);

  if (!norman) notFound();

  const kjars: any[] = norman.kjars || [];

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
            </div>
          </div>
        </div>
      </section>

      <section className="kjar-character__body">
        <div className="kjar-character__inner">
          {norman.description && (
            <section className="kjar-character__section">
              <h2 className="kjar-section__title">О тьорне</h2>
              <div className="kjar-markdown">
                <MarkdownRenderer content={norman.description} />
              </div>
            </section>
          )}

          <section className="kjar-character__section">
            <h2 className="kjar-section__title">Кьяры тьорна</h2>
            {kjars.length === 0 ? (
              <div className="kjar-empty">
                <p>Кьяров у этого тьорна пока нет.</p>
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
