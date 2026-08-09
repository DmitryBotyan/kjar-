"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import "./admin.css";

type AdminLayoutClientProps = {
  children: ReactNode;
};

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  useEffect(() => {
    // Скрываем header и footer для админки
    const header = document.querySelector(".kjar-header");
    const footer = document.querySelector(".kjar-footer");
    
    if (header) {
      (header as HTMLElement).style.display = "none";
    }
    if (footer) {
      (footer as HTMLElement).style.display = "none";
    }
    
    // Добавляем класс к body для стилей админки
    document.body.classList.add("kjar-admin-body");

    return () => {
      // Восстанавливаем при размонтировании
      if (header) {
        (header as HTMLElement).style.display = "";
      }
      if (footer) {
        (footer as HTMLElement).style.display = "";
      }
      document.body.classList.remove("kjar-admin-body");
    };
  }, []);

  return <>{children}</>;
}
