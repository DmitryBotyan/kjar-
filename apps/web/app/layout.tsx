import type { ReactNode } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import "./globals.css";

// Адрес сайта и почта редакции задаются окружением: в коде их быть не должно
const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@kjar.ru";

const title = "KJÁR — карточная ролевая игра северных хроник";
const description =
  "Мир KJÁR: колода персонажей, энциклопедия лора, ивенты и обсуждения северных хроник";

export const metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ru_RU"
  }
};

const navigation = [
  { href: "/", label: "Главная" },
  { href: "/lore", label: "Свод" },
  { href: "/characters", label: "Звери" },
  { href: "/posts", label: "Посты" },
  { href: "/events", label: "События" },
  { href: "/discussions", label: "Важное" },
  { href: "/contacts", label: "Связь" }
];

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <header className="kjar-header">
          <div className="kjar-header__inner">
            <div className="kjar-brand">
              <Link href="/" className="kjar-brand__link">
                <img
                  className="kjar-brand__mark"
                  src="/images/logo.png"
                  alt=""
                  width={44}
                  height={44}
                />
                <span className="kjar-brand__text">
                  <span className="kjar-brand__title">KJÁR</span>
                  <span className="kjar-brand__subtitle">Глубже только тишь</span>
                </span>
              </Link>
            </div>

            <nav className="kjar-nav" aria-label="Основная навигация">
              <ul className="kjar-nav__list">
                {navigation.map((item) => (
                  <li className="kjar-nav__item" key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="kjar-header__tools">
              <Link className="kjar-search" href="/search" title="Поиск по миру">
                <Search className="kjar-search__icon" aria-hidden="true" />
                <span className="kjar-sr-only">Поиск по миру</span>
              </Link>

              <details className="kjar-drawer">
                <summary className="kjar-drawer__trigger">
                  Меню
                  <Menu className="kjar-drawer__icon" aria-hidden="true" />
                </summary>
                <nav className="kjar-drawer__panel" aria-label="Мобильная навигация">
                  <ul className="kjar-nav__list">
                    {navigation.map((item) => (
                      <li className="kjar-nav__item" key={`drawer-${item.label}`}>
                        <Link href={item.href}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="kjar-footer">
          <div className="kjar-footer__inner">
            <div className="kjar-footer__brand">
              <div className="kjar-footer__lockup">
                <img
                  className="kjar-footer__mark"
                  src="/images/logo.png"
                  alt=""
                  width={56}
                  height={56}
                />
                <span className="kjar-footer__title">KJÁR</span>
              </div>
              <p className="kjar-footer__text">
                Карточная ролевая игра о северном лесе, ремесле рун и людях, которые
                держат тишину. Здесь живут колода персонажей, хроники эпох и общий
                стол для игроков.
              </p>
              <div className="kjar-footer__stack">
                <a className="kjar-footer__link" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                <Link className="kjar-footer__link" href="/contacts">
                  Написать редакции
                </Link>
              </div>
            </div>

            <div className="kjar-footer__columns">
              <div className="kjar-footer__column">
                <h2 className="kjar-footer__column-title">Мир</h2>
                <ul className="kjar-footer__list">
                  <li>
                    <Link className="kjar-footer__link" href="/lore">
                      Свод
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/characters">
                      Колода зверей
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/lore">
                      Эпохи и хроники
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="kjar-footer__column">
                <h2 className="kjar-footer__column-title">Игра</h2>
                <ul className="kjar-footer__list">
                  <li>
                    <Link className="kjar-footer__link" href="/events">
                      События
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/posts">
                      Посты и новости
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/discussions">
                      Важное
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="kjar-footer__column">
                <h2 className="kjar-footer__column-title">Участие</h2>
                <ul className="kjar-footer__list">
                  <li>
                    <Link className="kjar-footer__link" href="/discussions/new">
                      Создать тему
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/contacts">
                      Заявка на роль
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/contacts">
                      Обратная связь
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="kjar-footer__bottom">
            <span>© {new Date().getFullYear()} KJÁR</span>
            <span>Мир, который звучит тишиной</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
