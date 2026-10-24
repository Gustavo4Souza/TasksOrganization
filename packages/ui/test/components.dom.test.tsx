// @vitest-environment jsdom
// T0.2.10: estados, props e interações de todos os componentes do Design System.
import { type DayProgress, type MonthProgress, type PomodoroSnapshot, PomodoroTimer } from "@tasksorg/core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Button,
  Panel,
  PixelIcon,
  type PixelIconName,
  PomodoroHUD,
  RoomMap,
  ScopeTabs,
  StatBar,
  Tag,
  TaskCard,
  formatClock,
  roomsFromWeek,
  roomsFromYear,
} from "../src/components.js";

afterEach(cleanup);

describe("Panel", () => {
  it("o título vira o nome acessível da seção", () => {
    render(<Panel title="Em batalha">conteúdo</Panel>);
    expect(screen.getByRole("region", { name: "Em batalha" })).toHaveProperty("className", "px-panel");
    expect(screen.getByRole("heading", { level: 2, name: "Em batalha" })).toBeTruthy();
  });

  it("sem título não cria heading nem aria-labelledby", () => {
    const { container } = render(<Panel>sem título</Panel>);
    const section = container.querySelector("section")!;
    expect(section.getAttribute("aria-labelledby")).toBeNull();
    expect(container.querySelector("h2")).toBeNull();
  });

  it("junta className e repassa outras props", () => {
    const { container } = render(<Panel className="extra" data-testid="p" />);
    expect(container.querySelector("section")!.className).toBe("px-panel extra");
  });
});

describe("Button", () => {
  it.each(["primary", "secondary", "danger"] as const)("variante %s ganha a classe certa", (variant) => {
    render(<Button variant={variant}>Ok</Button>);
    expect(screen.getByRole("button", { name: "Ok" }).className).toBe(`px-button px-button--${variant}`);
  });

  it("padrão é primary e type=button", () => {
    render(<Button>Criar</Button>);
    const button = screen.getByRole("button", { name: "Criar" });
    expect(button.className).toContain("px-button--primary");
    expect(button.getAttribute("type")).toBe("button");
  });

  it("type=submit continua possível quando pedido", () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("submit");
  });

  it("chama onClick; desabilitado não chama", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Batalhar</Button>);
    fireEvent.click(screen.getByRole("button"));
    rerender(
      <Button onClick={onClick} disabled>
        Batalhar
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("encaminha a ref para o <button>", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Foco</Button>);
    expect(ref.current?.tagName).toBe("BUTTON");
  });
});

describe("Tag", () => {
  it.each(["gold", "mana", "moss", "crimson", "arcane"] as const)("tom %s", (tone) => {
    render(<Tag tone={tone}>{tone}</Tag>);
    expect(screen.getByText(tone).className).toBe(`px-tag px-tone--${tone}`);
  });

  it("padrão é gold", () => {
    render(<Tag>Média</Tag>);
    expect(screen.getByText("Média").className).toContain("px-tone--gold");
  });
});

describe("PixelIcon", () => {
  const names: PixelIconName[] = ["skull", "heart", "sword", "star", "check", "flag"];

  it.each(names)("desenha o ícone %s em pixel (crispEdges, grade 16)", (name) => {
    const { container } = render(<PixelIcon name={name} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 16 16");
    expect(svg.getAttribute("shape-rendering")).toBe("crispEdges");
    expect(svg.querySelector("path")!.getAttribute("d")).toMatch(/^M/);
  });

  it("os seis ícones são desenhos diferentes", () => {
    const paths = names.map((name) => render(<PixelIcon name={name} />).container.querySelector("path")!.getAttribute("d"));
    expect(new Set(paths).size).toBe(names.length);
  });

  it("decorativo fica escondido; com label vira imagem com nome", () => {
    render(
      <>
        <PixelIcon name="star" />
        <PixelIcon name="skull" label="Alta prioridade" />
      </>,
    );
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Alta prioridade" })).toBeTruthy();
  });
});

describe("TaskCard", () => {
  it.each([
    ["todo", "Missão"],
    ["doing", "Em batalha"],
    ["done", "Conquistada"],
  ] as const)("status %s mostra o estado em texto (%s), não só em cor", (status, label) => {
    render(<TaskCard title="Escrever o ci.yml" status={status} />);
    const card = screen.getByRole("article", { name: "Escrever o ci.yml" });
    expect(card.className).toContain(`px-task-card--${status}`);
    expect(within(card).getByRole("img", { name: label })).toBeTruthy();
  });

  it.each([
    ["high", "Alta", "px-tone--crimson"],
    ["medium", "Média", "px-tone--gold"],
    ["low", "Baixa", "px-tone--moss"],
  ] as const)("prioridade %s vira a tag %s", (priority, text, tone) => {
    render(<TaskCard title="x" priority={priority} />);
    expect(screen.getByText(text).className).toContain(tone);
  });

  it.each([
    [3, "3 focos"],
    [2.9, "2 focos"],
    [-1, "0 focos"],
  ])("pomodoros %s aparece como %s", (pomodoros, text) => {
    render(<TaskCard title="x" pomodoros={pomodoros} />);
    expect(screen.getByText(text)).toBeTruthy();
  });

  it("compacto ganha a classe de densidade", () => {
    render(<TaskCard title="Linha" compact />);
    expect(screen.getByRole("article").className).toContain("px-task-card--compact");
  });

  it("ações aparecem só quando passadas e funcionam", () => {
    const onDone = vi.fn();
    const { rerender, container } = render(<TaskCard title="Sem ações" />);
    expect(container.querySelector(".px-task-actions")).toBeNull();
    rerender(<TaskCard title="Com ações" actions={<Button onClick={onDone}>Concluir</Button>} />);
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("StatBar", () => {
  it("expõe progresso acessível e a largura proporcional", () => {
    render(<StatBar label="XP" value={7} max={12} tone="mana" />);
    const bar = screen.getByRole("progressbar", { name: "XP" });
    expect(bar.getAttribute("aria-valuenow")).toBe("7");
    expect(bar.getAttribute("aria-valuemax")).toBe("12");
    expect((bar.firstElementChild as HTMLElement).style.width).toBe(`${(7 / 12) * 100}%`);
    expect(screen.getByText("7/12")).toBeTruthy();
  });

  it("barra cheia e vazia", () => {
    render(
      <>
        <StatBar label="Cheia" value={10} max={10} />
        <StatBar label="Vazia" value={0} max={10} />
      </>,
    );
    expect((screen.getByRole("progressbar", { name: "Cheia" }).firstElementChild as HTMLElement).style.width).toBe("100%");
    expect((screen.getByRole("progressbar", { name: "Vazia" }).firstElementChild as HTMLElement).style.width).toBe("0%");
  });
});

describe("ScopeTabs", () => {
  const counts = { daily: 5, weekly: 12, yearly: 4 };

  function setup(value: "daily" | "weekly" | "yearly" = "daily") {
    const onChange = vi.fn();
    render(<ScopeTabs id="q" value={value} onChange={onChange} counts={counts} />);
    return { onChange, tabs: screen.getAllByRole("tab") };
  }

  it("mostra Hoje, Semana e Ano com os contadores", () => {
    const { tabs } = setup();
    expect(tabs.map((t) => t.textContent)).toEqual(["Hoje 5", "Semana 12", "Ano 4"]);
    expect(screen.getByRole("tablist", { name: "Escopo das missões" })).toBeTruthy();
  });

  it("clique troca o escopo", () => {
    const { onChange, tabs } = setup();
    fireEvent.click(tabs[2]!);
    expect(onChange).toHaveBeenCalledWith("yearly");
  });

  it.each([
    ["daily", "ArrowRight", "weekly", 1],
    ["daily", "ArrowLeft", "yearly", 2],
    ["yearly", "ArrowRight", "daily", 0],
    ["weekly", "Home", "daily", 0],
    ["daily", "End", "yearly", 2],
  ] as const)("teclado: em %s, %s vai para %s e move o foco", (value, key, expected, index) => {
    const { onChange, tabs } = setup(value);
    const current = tabs.find((t) => t.getAttribute("aria-selected") === "true")!;
    fireEvent.keyDown(current, { key });
    expect(onChange).toHaveBeenCalledWith(expected);
    expect(document.activeElement).toBe(tabs[index]);
  });

  it("outras teclas não fazem nada", () => {
    const { onChange, tabs } = setup();
    fireEvent.keyDown(tabs[0]!, { key: "a" });
    expect(onChange).not.toHaveBeenCalled();
  });
});

const snapshot = (over: Partial<PomodoroSnapshot> = {}): PomodoroSnapshot => ({
  phase: "focus",
  state: "idle",
  remainingSeconds: 25 * 60,
  completedFocusCycles: 0,
  ...over,
});

describe("formatClock", () => {
  it.each([
    [1500, "25:00"],
    [1122, "18:42"],
    [59, "00:59"],
    [7200, "120:00"],
    [-3, "00:00"],
    [Number.NaN, "00:00"],
    [61.9, "01:01"],
  ])("%s s → %s", (seconds, text) => {
    expect(formatClock(seconds)).toBe(text);
  });
});

describe("PomodoroHUD (T0.2.9)", () => {
  it.each([
    ["focus", "Foco", "px-tone--mana"],
    ["shortBreak", "Save point", "px-tone--moss"],
    ["longBreak", "Santuário", "px-tone--arcane"],
  ] as const)("fase %s mostra %s com a cor da fase", (phase, label, tone) => {
    render(<PomodoroHUD snapshot={snapshot({ phase, state: "running", remainingSeconds: 60 })} />);
    const hud = screen.getByRole("region", { name: "Pomodoro" });
    expect(hud.className).toContain(tone);
    expect(within(hud).getByText(label)).toBeTruthy();
  });

  it("relógio e barra mostram o tempo restante", () => {
    render(<PomodoroHUD snapshot={snapshot({ state: "running", remainingSeconds: 1122 })} />);
    expect(screen.getByRole("timer").textContent).toBe("18:42");
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("1122");
    expect(bar.getAttribute("aria-valuetext")).toBe("18:42 de 25:00");
    expect((bar.firstElementChild as HTMLElement).style.width).toBe(`${(1122 / 1500) * 100}%`);
  });

  it("usa os tempos configurados para a barra", () => {
    render(<PomodoroHUD snapshot={snapshot({ remainingSeconds: 3000 })} config={{ focusMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, cyclesBeforeLongBreak: 3 }} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe("3000");
    expect(document.querySelectorAll(".px-pomo-orb")).toHaveLength(3);
  });

  it.each([
    [{ state: "idle" as const }, "Iniciar"],
    [{ state: "running" as const, remainingSeconds: 1000 }, "Pausar"],
    [{ state: "paused" as const, remainingSeconds: 1000 }, "Continuar"],
  ])("botão principal: %o → %s", (over, label) => {
    render(<PomodoroHUD snapshot={snapshot(over)} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: label })).toBeTruthy();
  });

  it("pausado avisa no rótulo da fase", () => {
    render(<PomodoroHUD snapshot={snapshot({ state: "paused", remainingSeconds: 1000 })} />);
    expect(screen.getByText("Foco · pausado")).toBeTruthy();
  });

  it("orbes acendem pelos ciclos do ciclo atual; no Santuário, todos", () => {
    const { rerender } = render(<PomodoroHUD snapshot={snapshot({ completedFocusCycles: 6 })} />);
    expect(screen.getByRole("img", { name: /^2 de 4 focos até o Santuário · 6 no total$/ })).toBeTruthy();
    expect(document.querySelectorAll(".px-pomo-orb--on")).toHaveLength(2);
    rerender(<PomodoroHUD snapshot={snapshot({ phase: "longBreak", remainingSeconds: 60, completedFocusCycles: 4 })} />);
    expect(document.querySelectorAll(".px-pomo-orb--on")).toHaveLength(4);
  });

  it("mostra a missão em batalha, ou avisa que não há", () => {
    const { rerender } = render(<PomodoroHUD snapshot={snapshot()} battleTitle="Montar a tela pixel" />);
    expect(screen.getByText("Montar a tela pixel")).toBeTruthy();
    rerender(<PomodoroHUD snapshot={snapshot()} battleTitle={null} />);
    expect(screen.getByText("Nenhuma missão em batalha")).toBeTruthy();
  });

  it("só mostra os controles passados, e eles chamam os callbacks", () => {
    const onToggle = vi.fn();
    const onSkip = vi.fn();
    const onReset = vi.fn();
    const { rerender } = render(<PomodoroHUD snapshot={snapshot()} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);

    rerender(<PomodoroHUD snapshot={snapshot()} onToggle={onToggle} onSkip={onSkip} onReset={onReset} />);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar" }));
    fireEvent.click(screen.getByRole("button", { name: "Pular fase" }));
    fireEvent.click(screen.getByRole("button", { name: "Resetar" }));
    expect([onToggle, onSkip, onReset].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it("funciona com o snapshot real do PomodoroTimer do core", () => {
    const timer = new PomodoroTimer();
    timer.start();
    timer.tick(25 * 60);
    render(<PomodoroHUD snapshot={timer.getSnapshot()} />);
    expect(screen.getByText("Save point")).toBeTruthy();
    expect(screen.getByRole("timer").textContent).toBe("05:00");
  });

  it("restante fora da faixa não quebra a barra", () => {
    render(<PomodoroHUD snapshot={snapshot({ remainingSeconds: 99_999 })} />);
    expect(screen.getByRole("timer").textContent).toBe("25:00");
  });
});

const day = (date: string, completed: number, level: 0 | 1 | 2 | 3, flags: Partial<DayProgress> = {}): DayProgress => ({
  date,
  completed,
  level,
  isToday: false,
  isFuture: false,
  ...flags,
});

describe("RoomMap (T0.2.9)", () => {
  const week = [
    day("2026-09-28", 1, 1),
    day("2026-09-29", 0, 0),
    day("2026-09-30", 3, 2),
    day("2026-10-01", 0, 0),
    day("2026-10-02", 5, 3, { isToday: true }),
    day("2026-10-03", 0, 0, { isFuture: true }),
    day("2026-10-04", 0, 0, { isFuture: true }),
  ];

  it("roomsFromWeek: letras de segunda a domingo e descrição completa", () => {
    const rooms = roomsFromWeek(week);
    expect(rooms.map((r) => r.label).join("")).toBe("STQQSSD");
    expect(rooms[2]!.description).toBe("Quarta, 30/09: 3 conquistas, nível 2 de 3");
    expect(rooms[0]!.description).toBe("Segunda, 28/09: 1 conquista, nível 1 de 3");
    expect(rooms[4]).toMatchObject({ current: true, description: "Sexta, 02/10 (hoje): 5 conquistas, nível 3 de 3" });
    expect(rooms[5]).toMatchObject({ future: true, description: "Sábado, 03/10: ainda não chegou" });
  });

  it("roomsFromYear: iniciais dos meses, dias ativos e meses futuros", () => {
    const month = (m: string, over: Partial<MonthProgress>): MonthProgress => ({
      month: m,
      completed: 0,
      activeDays: 0,
      elapsedDays: 30,
      level: 0,
      isCurrent: false,
      ...over,
    });
    const rooms = roomsFromYear([
      month("2026-09", { completed: 12, activeDays: 10, level: 2 }),
      month("2026-10", { completed: 2, activeDays: 2, elapsedDays: 2, level: 3, isCurrent: true }),
      month("2026-11", { elapsedDays: 0 }),
    ]);
    expect(rooms.map((r) => r.label)).toEqual(["S", "O", "N"]);
    expect(rooms[0]!.description).toBe("Setembro: 12 conquistas em 10 de 30 dias, nível 2 de 3");
    expect(rooms[1]).toMatchObject({ current: true, description: "Outubro (mês atual): 2 conquistas em 2 de 2 dias, nível 3 de 3" });
    expect(rooms[2]).toMatchObject({ future: true, description: "Novembro: ainda não chegou" });
  });

  it("lista ordenada com nome, nível por sala e o dia de hoje marcado", () => {
    render(<RoomMap label="Semana" rooms={roomsFromWeek(week)} />);
    const list = screen.getByRole("list", { name: "Semana" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(7);
    expect(items.map((li) => li.getAttribute("data-level"))).toEqual(["1", "0", "2", "0", "3", "0", "0"]);
    expect(items[4]!.getAttribute("aria-current")).toBe("date");
    expect(items[4]!.className).toContain("px-room--current");
    expect(items[5]!.className).toContain("px-room--future");
    expect(items.filter((li) => li.getAttribute("aria-current"))).toHaveLength(1);
  });

  it("o nível está em texto para leitores de tela e no tooltip, não só na cor", () => {
    render(<RoomMap label="Semana" rooms={roomsFromWeek(week)} />);
    const item = screen.getAllByRole("listitem")[2]!;
    expect(item.querySelector(".px-sr-only")!.textContent).toBe("Quarta, 30/09: 3 conquistas, nível 2 de 3");
    expect(item.getAttribute("title")).toBe("Quarta, 30/09: 3 conquistas, nível 2 de 3");
    expect(item.querySelector('[aria-hidden="true"]')!.textContent).toBe("Q");
  });

  it("colunas configuráveis via variável CSS", () => {
    render(<RoomMap label="Ano" rooms={[]} columns={6} />);
    expect(screen.getByRole("list", { name: "Ano" }).style.getPropertyValue("--px-map-cols")).toBe("6");
  });
});
