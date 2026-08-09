import Link from "next/link";

export default function NotFound() {
  return (
    <div className="kjar-notfound">
      <span className="kjar-notfound__rune" aria-hidden="true">
        ᛉ
      </span>
      <h1 className="kjar-notfound__title">Тропа обрывается</h1>
      <p className="kjar-notfound__text">
        Такой страницы в хрониках нет: карта могла уйти из колоды, а статью ещё не
        дописали. Вернитесь к началу или поищите в энциклопедии.
      </p>
      <div className="kjar-hero__actions">
        <Link className="kjar-button kjar-button--primary" href="/">
          На главную
        </Link>
        <Link className="kjar-button kjar-button--ghost" href="/lore">
          В энциклопедию
        </Link>
      </div>
    </div>
  );
}
