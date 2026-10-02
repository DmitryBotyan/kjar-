"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Newspaper,
  CalendarDays,
  PawPrint,
  Shield,
  Image as ImageIcon,
  MessagesSquare,
  MessageCircle,
  Mail,
  FolderTree,
  Tags,
  ListTree,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  Menu,
  X
} from "lucide-react";
import "./admin.css";

type User = { id: number; username: string; role: string };
type Counts = { contacts: number; comments: number; works: number };
type Section = {
  href: string;
  label: string;
  icon: typeof BookOpen;
  badge?: keyof Counts;
};

const GROUPS: Array<{ title: string; items: Section[] }> = [
  {
    title: "Материалы",
    items: [
      { href: "/admin/articles", label: "Статьи", icon: BookOpen },
      { href: "/admin/posts", label: "Посты", icon: Newspaper },
      { href: "/admin/events", label: "Ивенты", icon: CalendarDays }
    ]
  },
  {
    title: "Мир",
    items: [
      { href: "/admin/characters", label: "Кьяры", icon: PawPrint },
      { href: "/admin/normans", label: "Норманны", icon: Shield },
      { href: "/admin/works", label: "Работы", icon: ImageIcon, badge: "works" }
    ]
  },
  {
    title: "Сообщество",
    items: [
      { href: "/admin/threads", label: "Обсуждения", icon: MessagesSquare },
      { href: "/admin/comments", label: "Комментарии", icon: MessageCircle, badge: "comments" },
      { href: "/admin/contacts", label: "Обращения", icon: Mail, badge: "contacts" }
    ]
  },
  {
    title: "Настройки",
    items: [
      { href: "/admin/categories", label: "Категории", icon: FolderTree },
      { href: "/admin/tags", label: "Теги", icon: Tags },
      { href: "/admin/dictionaries", label: "Справочники", icon: ListTree }
    ]
  }
];

const STAFF = ["mod", "admin"];

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<"checking" | "guest" | "ready">("checking");
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("kjar-admin-body");
    return () => document.body.classList.remove("kjar-admin-body");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setState("guest");
      return;
    }

    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body) => {
        if (STAFF.includes(body.data?.role)) {
          setUser(body.data);
          setState("ready");
        } else {
          setState("guest");
        }
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        setState("guest");
      });
  }, []);

  // Разделы сами сбрасывают токен на 401 — тогда снова показываем вход
  useEffect(() => {
    setMenuOpen(false);
    if (state === "ready" && !localStorage.getItem("authToken")) {
      setUser(null);
      setState("guest");
    }
  }, [pathname, state]);

  const loadCounts = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const read = (url: string) =>
      fetch(url, { headers, cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null);

    Promise.all([
      read("/api/contacts?status=new&limit=1"),
      read("/api/comments?approved=false&limit=1"),
      read("/api/works?approved=false")
    ]).then(([contacts, comments, works]) =>
      setCounts({
        contacts: Number(contacts?.total || 0),
        comments: Number(comments?.total || 0),
        works: Array.isArray(works?.data) ? works.data.length : 0
      })
    );
  }, []);

  useEffect(() => {
    if (state === "ready") loadCounts();
  }, [state, pathname, loadCounts]);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || "Ошибка входа");
      if (!STAFF.includes(body.data.user.role)) {
        throw new Error("Недостаточно прав для доступа к админке");
      }

      localStorage.setItem("authToken", body.data.token);
      setUser(body.data.user);
      setState("ready");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Ошибка входа");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setCounts(null);
    setState("guest");
  };

  if (state === "checking") {
    return <div className="kjar-admin__loading">Загрузка...</div>;
  }

  if (state === "guest") {
    return (
      <div className="kjar-admin__login-container">
        <div className="kjar-admin__login-card">
          <h1 className="kjar-admin__login-title">Вход в админ-панель</h1>
          {loginError && <div className="kjar-admin__error">{loginError}</div>}
          <form className="kjar-form-card" onSubmit={login}>
            <div className="kjar-field">
              <label className="kjar-label" htmlFor="username">
                Логин
              </label>
              <input
                className="kjar-input"
                id="username"
                name="username"
                required
                autoComplete="username"
              />
            </div>
            <div className="kjar-field">
              <label className="kjar-label" htmlFor="password">
                Пароль
              </label>
              <input
                className="kjar-input"
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="kjar-form-actions">
              <button type="submit" className="kjar-button kjar-button--primary" disabled={loginLoading}>
                {loginLoading ? "Вход..." : "Войти"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={`kjar-cabinet${menuOpen ? " kjar-cabinet--menu" : ""}`}>
      <aside className="kjar-cabinet__side">
        <div className="kjar-cabinet__brand">
          <Link href="/admin" className="kjar-cabinet__logo">
            <img src="/images/logo.png" alt="" width={32} height={32} />
            <span>KJÁR</span>
          </Link>
          <button
            type="button"
            className="kjar-cabinet__toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="kjar-cabinet-nav"
            aria-label={menuOpen ? "Скрыть разделы" : "Показать разделы"}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        <nav className="kjar-cabinet__nav" id="kjar-cabinet-nav" aria-label="Разделы админки">
          <Link
            href="/admin"
            className={`kjar-cabinet__link${pathname === "/admin" ? " is-active" : ""}`}
            aria-current={pathname === "/admin" ? "page" : undefined}
          >
            <LayoutDashboard aria-hidden="true" />
            Обзор
          </Link>

          {GROUPS.map((group) => (
            <div className="kjar-cabinet__group" key={group.title}>
              <p className="kjar-cabinet__group-title">{group.title}</p>
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const count = badge && counts ? counts[badge] : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`kjar-cabinet__link${isActive(href) ? " is-active" : ""}`}
                    aria-current={isActive(href) ? "page" : undefined}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                    {count > 0 && <span className="kjar-cabinet__badge">{count}</span>}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="kjar-cabinet__account">
            <p className="kjar-cabinet__user">
              {user?.username}
              <span>{user?.role === "admin" ? "администратор" : "модератор"}</span>
            </p>
            <Link href="/" className="kjar-cabinet__link">
              <ExternalLink aria-hidden="true" />
              На сайт
            </Link>
            <button type="button" className="kjar-cabinet__link" onClick={logout}>
              <LogOut aria-hidden="true" />
              Выйти
            </button>
          </div>
        </nav>
      </aside>

      <div className="kjar-cabinet__main">{children}</div>
    </div>
  );
}
