import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasksOrg — Organização pessoal",
  description: "Organize tarefas, prioridades e sessões de foco em um só lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
