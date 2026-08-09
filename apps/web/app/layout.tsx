import type { ReactNode } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import "./globals.css";

export const metadata = {
  title: "KJÁR — карточная ролевая игра северных хроник",
  description:
    "Мир KJÁR: колода персонажей, энциклопедия лора, ивенты и обсуждения северных хроник"
};

const navigation = [
  { href: "/", label: "Главная" },
  { href: "/lore", label: "Энциклопедия" },
  { href: "/characters", label: "Персонажи" },
  { href: "/posts", label: "Посты" },
  { href: "/events", label: "Ивенты" },
  { href: "/discussions", label: "Обсуждения" },
  { href: "/contacts", label: "Контакты" }
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
                  width={38}
                  height={38}
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
              <span className="kjar-footer__title">KJÁR</span>
              <p className="kjar-footer__text">
                Карточная ролевая игра о северном лесе, ремесле рун и людях, которые
                держат тишину. Здесь живут колода персонажей, хроники эпох и общий
                стол для игроков.
              </p>
              <div className="kjar-footer__stack">
                <a className="kjar-footer__link" href="mailto:редакция@kjar.example">
                  редакция@kjar.example
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
                      Энциклопедия
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/characters">
                      Колода персонажей
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
                      Ивенты
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/posts">
                      Посты и новости
                    </Link>
                  </li>
                  <li>
                    <Link className="kjar-footer__link" href="/discussions">
                      Обсуждения
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
            <span>© 2026 KJÁR</span>
            <span>Мир, который звучит тишиной</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
