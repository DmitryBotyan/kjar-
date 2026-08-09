"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  email: string;
  username: string | null;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Проверяем токен при загрузке
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // Проверяем валидность токена через API
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error("Недействительный токен");
        })
        .then((data) => {
          if (data.data && ["mod", "admin"].includes(data.data.role)) {
            setUser(data.data);
            setShowLogin(false);
          } else {
            setShowLogin(true);
          }
        })
        .catch(() => {
          localStorage.removeItem("authToken");
          setShowLogin(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setShowLogin(true);
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;

    // Проверяем, что поля заполнены
    if (!email || !password) {
      setLoginError("Заполните все поля");
      setLoginLoading(false);
      return;
    }

    const requestBody = JSON.stringify({ email, password });
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка входа");
      }

      const data = await response.json();
      
      // Проверяем роль пользователя
      if (!["mod", "admin"].includes(data.data.user.role)) {
        throw new Error("Недостаточно прав для доступа к админке");
      }

      // Сохраняем токен
      localStorage.setItem("authToken", data.data.token);
      setUser(data.data.user);
      setShowLogin(false);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setShowLogin(true);
  };

  if (loading) {
    return (
      <div className="kjar-admin">
        <div className="kjar-admin__loading">Загрузка...</div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="kjar-admin">
        <div className="kjar-admin__login-container">
          <div className="kjar-admin__login-card">
            <h1 className="kjar-admin__login-title">Вход в админ-панель</h1>
            
            {loginError && (
              <div className="kjar-admin__error">
                {loginError}
              </div>
            )}

            <form className="kjar-form-card" onSubmit={handleLogin}>
              <div className="kjar-field">
                <label className="kjar-label" htmlFor="email">
                  Email *
                </label>
                <input
                  className="kjar-input"
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="password">
                  Пароль *
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
                <button
                  type="submit"
                  className="kjar-button kjar-button--primary"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Вход..." : "Войти"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Админ-панель</h1>
        <div className="kjar-admin__header-actions">
          <span className="kjar-admin__user-info">
            {user?.username || user?.email} ({user?.role})
          </span>
          <button
            onClick={handleLogout}
            className="kjar-button kjar-button--ghost"
          >
            Выйти
          </button>
          <Link href="/" className="kjar-button kjar-button--ghost">
            На сайт
          </Link>
        </div>
      </div>

      <div className="kjar-admin__nav">
        <nav className="kjar-admin__nav-list">
          <Link href="/admin/articles" className="kjar-admin__nav-item">
            Статьи
          </Link>
          <Link href="/admin/posts" className="kjar-admin__nav-item">
            Посты
          </Link>
          <Link href="/admin/events" className="kjar-admin__nav-item">
            Ивенты
          </Link>
          <Link href="/admin/characters" className="kjar-admin__nav-item">
            Персонажи
          </Link>
          <Link href="/admin/categories" className="kjar-admin__nav-item">
            Категории
          </Link>
          <Link href="/admin/tags" className="kjar-admin__nav-item">
            Теги
          </Link>
        </nav>
      </div>

      <div className="kjar-admin__content">
        <p className="kjar-admin__welcome">
          Выберите раздел для управления контентом
        </p>
      </div>
    </div>
  );
}
