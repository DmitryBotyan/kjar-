"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cookieNoticeAccepted";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  return (
    <div className="kjar-cookie" role="region" aria-label="Уведомление о cookie">
      <p className="kjar-cookie__text">
        Сайт использует cookie и хранилище браузера только для своей работы: запоминает ваше
        имя в комментариях и голос в опросах. Аналитики и рекламы здесь нет.
      </p>
      <button type="button" className="kjar-button kjar-button--primary" onClick={accept}>
        Понятно
      </button>
    </div>
  );
}
