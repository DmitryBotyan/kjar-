import type { ReactNode } from "react";
import AdminLayoutClient from "./layout-client";

export const metadata = {
  title: "Админ-панель - KJÁR",
  description: "Управление контентом сайта KJÁR"
};

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
