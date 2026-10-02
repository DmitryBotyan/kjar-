"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import "./admin.css";

type AdminLayoutClientProps = {
  children: ReactNode;
};

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  useEffect(() => {
    const header = document.querySelector(".kjar-header");
    const footer = document.querySelector(".kjar-footer");
    
    if (header) {
      (header as HTMLElement).style.display = "none";
    }
    if (footer) {
      (footer as HTMLElement).style.display = "none";
    }
    
    document.body.classList.add("kjar-admin-body");

    return () => {
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
