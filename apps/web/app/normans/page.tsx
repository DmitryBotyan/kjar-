import Link from "next/link";
import { getNormans } from "@/lib/api";

export const metadata = {
  title: "Норманны — KJÁR"
};

function kjarWord(count: number) {
  const tail = count % 100;
  if (tail >= 11 && tail <= 14) return "кьяров";
  if (count % 10 === 1) return "кьяр";
  if ([2, 3, 4].includes(count % 10)) return "кьяра";
  return "кьяров";
}

export default async function NormansPage() {
  const normans: any[] = await getNormans()
    .then((response) => response.data || [])
    .catch(() => []);

  return (
    <div className="kjar-characters">
      <section className="kjar-characters__hero">
        <div className="kjar-characters__inner">
          <header className="kjar-characters__header">
            <h1 className="kjar-characters__title">Норманны</h1>
            <p className="kjar-characters__lead">
              Тьорны — те, кто держит кьяров при себе. У каждого свой двор и свои звери.
            </p>
          </header>
        </div>
      </section>

      <section className="kjar-characters__body">
        <div className="kjar-characters__inner">
          {normans.length === 0 ? (
            <div className="kjar-empty">
              <p>Тьорнов пока нет.</p>
            </div>
          ) : (
            <ul className="kjar-normans">
              {normans.map((norman) => (
                <li key={norman.id}>
                  <Link className="kjar-norman-card" href={`/normans/${norman.slug}`}>
                    <span className="kjar-norman-card__image">
                      {norman.image ? <img src={norman.image} alt="" loading="lazy" /> : <span />}
                    </span>
                    <span className="kjar-norman-card__body">
                      <span className="kjar-norman-card__name">{norman.name}</span>
                      {norman.summary && (
                        <span className="kjar-norman-card__summary">{norman.summary}</span>
                      )}
                      <span className="kjar-norman-card__count">
                        {norman.kjarCount} {kjarWord(norman.kjarCount)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
