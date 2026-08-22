import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasksOrg — POC",
  description: "POC do app de organização de tarefas inspirado no Notion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
