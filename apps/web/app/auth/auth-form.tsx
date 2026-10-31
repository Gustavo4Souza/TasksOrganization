"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Panel, PixelIcon } from "@tasksorg/ui";
import "@tasksorg/ui/styles.css";
import "./auth.css";

type AuthMode = "login" | "register";
type Theme = "castelo" | "pergaminho";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function messageFrom(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Não foi possível entrar. Tente novamente.";
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { message?: unknown; error?: unknown };
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.error === "string") return payload.error;
  } catch { /* a resposta pode não conter JSON */ }
  return response.status === 401 ? "E-mail ou senha inválidos." : "O serviço está indisponível. Tente novamente em instantes.";
}

export function AuthForm({ mode, apiBaseUrl = apiUrl }: { mode: AuthMode; apiBaseUrl?: string }) {
  const register = mode === "register";
  const [theme, setTheme] = useState<Theme>("castelo");
  const [themeReady, setThemeReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("tasksorg:theme");
      setTheme(saved === "castelo" || saved === "pergaminho" ? saved : window.matchMedia("(prefers-color-scheme: light)").matches ? "pergaminho" : "castelo");
    } catch { /* mantém Castelo */ }
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem("tasksorg:theme", theme); } catch { /* preferência só nesta sessão */ }
  }, [theme, themeReady]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (register && password !== confirmation) { setError("As senhas precisam ser iguais."); return; }
    if (!apiBaseUrl) { setError("O serviço está indisponível. Tente novamente em instantes."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(register ? { name, email, password } : { email, password }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      window.location.assign("/");
    } catch (reason) {
      setError(messageFrom(reason));
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-screen">
    <header className="auth-header">
      <Link href="/">← Voltar ao Quadro</Link>
      <Button variant="secondary" onClick={() => setTheme(theme === "castelo" ? "pergaminho" : "castelo")}>Tema {theme === "castelo" ? "Pergaminho" : "Castelo"}</Button>
    </header>
    <section className="auth-layout" aria-labelledby="auth-title">
      <div className="auth-intro">
        <p className="auth-eyebrow">TasksOrg / Portal do aventureiro</p>
        <PixelIcon name={register ? "star" : "sword"} />
        <h1 id="auth-title">{register ? "Comece sua jornada" : "Continue sua missão"}</h1>
        <p>{register ? "Crie sua conta para levar suas missões a qualquer dispositivo." : "Entre para recuperar suas missões, seu foco e suas conquistas."}</p>
        <ul className="auth-perks" aria-label="Recursos da conta">
          <li><PixelIcon name="check" /> Missões sincronizadas</li>
          <li><PixelIcon name="heart" /> Pomodoro preservado</li>
          <li><PixelIcon name="flag" /> Progresso em todos os mapas</li>
        </ul>
      </div>
      <Panel title={register ? "Criar conta" : "Entrar"} className="auth-panel">
        <form className="auth-form" onSubmit={submit} aria-busy={loading}>
          {register && <label>Nome do aventureiro<input name="name" autoComplete="name" minLength={2} maxLength={80} required disabled={loading} /></label>}
          <label>E-mail<input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} required disabled={loading} /></label>
          <label>Senha<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={8} maxLength={128} required disabled={loading} /></label>
          {register && <label>Confirmar senha<input name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={loading} /></label>}
          {error && <p className="auth-error" role="alert"><PixelIcon name="skull" /> {error}</p>}
          {loading && <div className="auth-loading" role="status"><span /><span /><span /> Salvando progresso...</div>}
          <Button type="submit" disabled={loading}>{loading ? "Aguarde..." : register ? "Criar conta" : "Entrar"}</Button>
        </form>
        <p className="auth-switch">{register ? "Já possui uma conta?" : "Ainda não tem uma conta?"} <Link href={register ? "/login" : "/cadastro"}>{register ? "Entrar" : "Criar conta"}</Link></p>
      </Panel>
    </section>
  </main>;
}
