import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const silkscreen = localFont({
  src: [
    { path: "./fonts/Silkscreen-Regular.ttf", weight: "400" },
    { path: "./fonts/Silkscreen-Bold.ttf", weight: "700" },
  ],
  variable: "--font-silkscreen",
  display: "swap",
});
const pixelifySans = localFont({
  src: "./fonts/PixelifySans[wght].ttf",
  variable: "--font-pixelify",
  display: "swap",
});
const jersey10 = localFont({
  src: "./fonts/Jersey10-Regular.ttf",
  variable: "--font-jersey",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TasksOrg",
  description: "Missões, foco e progresso em um só quadro.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${silkscreen.variable} ${pixelifySans.variable} ${jersey10.variable}`}>{children}</body>
    </html>
  );
}
