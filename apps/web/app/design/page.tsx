"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Panel,
  PixelIcon,
  PomodoroHUD,
  RoomMap,
  ScopeTabs,
  StatBar,
  Tag,
  TaskCard,
  roomsFromWeek,
  roomsFromYear,
  usePomodoro,
} from "@tasksorg/ui";
import { type Task, createTask, weekProgress, yearProgress } from "@tasksorg/core";
import type { Accent, PixelIconName, Scope } from "@tasksorg/ui";
import "@tasksorg/ui/styles.css";
import "./design.css";

const icons: PixelIconName[] = [
  "skull",
  "heart",
  "sword",
  "star",
  "check",
  "flag",
];
const names = ["Caveira", "Coração", "Espada", "Estrela", "Check", "Bandeira"];
const tones: Accent[] = ["gold", "mana", "moss", "crimson", "arcane"];
const scopes: Scope[] = ["daily", "weekly", "yearly"];

/** Tempos curtos para ver a troca de fase no catálogo sem esperar 25 minutos. */
const demoConfig = { focusMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 2, cyclesBeforeLongBreak: 4 };

/** Conclusões de exemplo, relativas a hoje, para desenhar o mapa. */
function sampleTasks(today: Date): Task[] {
  const doneDaysAgo = (days: number, count: number) =>
    Array.from({ length: count }, () => ({
      ...createTask({ title: "Exemplo" }),
      status: "done" as const,
      completedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - days, 12).toISOString(),
    }));
  return [0, 1, 2, 3, 5, 8, 13, 21, 34, 40, 55, 70, 90, 120, 150, 200, 240].flatMap((days, i) => doneDaysAgo(days, (i % 5) + 1));
}

export default function DesignPage() {
  const [theme, setTheme] = useState<"castelo" | "pergaminho">("castelo");
  const [scope, setScope] = useState<Scope>("daily");
  const [status, setStatus] = useState<"todo" | "doing" | "done">("todo");
  const pomodoro = usePomodoro({ storage: null, config: demoConfig });
  // A data entra no efeito para o HTML do servidor e o do navegador serem iguais.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  const maps = useMemo(() => {
    if (!today) return null;
    const tasks = sampleTasks(today);
    return { week: roomsFromWeek(weekProgress(tasks, today)), year: roomsFromYear(yearProgress(tasks, today.getFullYear(), today)) };
  }, [today]);
  return (
    <div className="design-root" data-theme={theme}>
      <main className="design-catalog">
        <header className="design-header">
          <div>
            <Link href="/">← Voltar ao quadro</Link>
            <p className="design-eyebrow">TASKSORG / DESIGN SYSTEM</p>
            <h1>Inventário visual</h1>
            <p>Peças para construir suas próximas conquistas.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              setTheme(theme === "castelo" ? "pergaminho" : "castelo")
            }
          >
            Tema: {theme === "castelo" ? "Castelo" : "Pergaminho"}
          </Button>
        </header>
        <div className="design-grid">
          <Panel title="01 / Ações">
            <div className="design-row">
              <Button onClick={() => setStatus("doing")}>
                <PixelIcon name="sword" />
                Batalhar
              </Button>
              <Button variant="secondary" onClick={() => setStatus("todo")}>
                Recuar
              </Button>
              <Button variant="danger" onClick={() => setStatus("todo")}>
                Reiniciar exemplo
              </Button>
              <Button disabled>Indisponível</Button>
              <Button
                aria-label="Concluir missão de exemplo"
                onClick={() => setStatus("done")}
              >
                <PixelIcon name="check" />
              </Button>
            </div>
            <p role="status">
              Missão de exemplo:{" "}
              {status === "todo"
                ? "aguardando"
                : status === "doing"
                  ? "em batalha"
                  : "conquistada"}
              .
            </p>
          </Panel>
          <Panel title="02 / Marcas e símbolos">
            <div className="design-row">
              {tones.map((tone) => (
                <Tag key={tone} tone={tone}>
                  {tone}
                </Tag>
              ))}
            </div>
            <div className="design-icons">
              {icons.map((name, index) => (
                <div key={name}>
                  <PixelIcon name={name} />
                  <span>{names[index]}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="03 / Missões">
            <div className="design-stack">
              <TaskCard
                title="Explorar o Design System"
                status={status}
                priority="high"
                pomodoros={2}
              />
              <TaskCard
                title="Construir o próximo componente"
                status="doing"
                pomodoros={1}
              />
              <TaskCard
                title="Carregar as fontes locais"
                status="done"
                priority="low"
                pomodoros={3}
              />
              <TaskCard title="Missão em formato compacto" compact />
            </div>
          </Panel>
          <Panel title="04 / Escopo e progresso">
            <ScopeTabs
              id="catalog"
              value={scope}
              onChange={setScope}
              counts={{ daily: 3, weekly: 12, yearly: 48 }}
            />
            {scopes.map((item) => (
              <div
                key={item}
                role="tabpanel"
                id={`catalog-panel-${item}`}
                aria-labelledby={`catalog-tab-${item}`}
                hidden={scope !== item}
                tabIndex={0}
                className="design-tab-panel"
              >
                <p>
                  {
                    {
                      daily: "Missões de hoje",
                      weekly: "Missões da semana",
                      yearly: "Missões do ano",
                    }[item]
                  }
                </p>
                <StatBar
                  label="Conquistas"
                  value={{ daily: 2, weekly: 7, yearly: 18 }[item]}
                  max={{ daily: 3, weekly: 12, yearly: 48 }[item]}
                  tone={item === "yearly" ? "arcane" : "gold"}
                />
              </div>
            ))}
            <div className="design-stack">
              <StatBar label="Energia de foco" value={65} tone="mana" />
              <StatBar label="Jornada concluída" value={100} tone="moss" />
              <StatBar label="Nova jornada" value={0} />
            </div>
          </Panel>
          <Panel title="05 / Tipografia">
            <p className="px-type-title">Nova jornada</p>
            <p className="px-type-heading">Silkscreen / Títulos</p>
            <p className="px-type-body">
              Pixelify Sans / Missões, foco e conquistas.
            </p>
            <p className="px-type-timer">25:00</p>
            <p className="px-type-label">Jersey 10 / Relógio e contadores</p>
          </Panel>
          <PomodoroHUD
            title="06 / Pomodoro (demo: Foco de 1 min)"
            snapshot={pomodoro.snapshot}
            config={demoConfig}
            battleTitle={status === "doing" ? "Explorar o Design System" : null}
            onToggle={pomodoro.toggle}
            onSkip={pomodoro.skip}
            onReset={pomodoro.reset}
          />
          <Panel title="07 / Mapa de progresso">
            {maps ? (
              <div className="design-stack">
                <p className="px-type-label">Semana</p>
                <RoomMap label="Semana" rooms={maps.week} columns={7} />
                <p className="px-type-label">Ano</p>
                <RoomMap label="Ano" rooms={maps.year} columns={6} />
              </div>
            ) : (
              <p>Carregando mapa…</p>
            )}
          </Panel>
        </div>
        <footer>
          Use Tab para navegar e as setas, Home e End para mudar o escopo.
        </footer>
      </main>
    </div>
  );
}
