import { expect, test, type Page } from "@playwright/test";

async function abrirQuadro(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Criar" })).toBeEnabled();
}

async function criarMissao(page: Page, titulo: string) {
  await page.getByRole("textbox", { name: "Nova missão" }).fill(titulo);
  await page.getByRole("button", { name: "Criar" }).click();
  await expect(page.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
}

test("atalhos controlam escopo, Pomodoro, nova missão e Modo foco", async ({ page }) => {
  await abrirQuadro(page);

  await page.keyboard.press("n");
  await expect(page.getByRole("textbox", { name: "Nova missão" })).toBeFocused();
  await page.getByRole("heading", { name: "Seu próximo passo" }).click();

  await page.keyboard.press("2");
  await expect(page.getByRole("tab", { name: /Semana/ })).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();

  await page.keyboard.press("f");
  await expect(page).toHaveURL(/\/foco$/);
});

test("missão muda de coluna por arrastar e também pelo teclado", async ({ page }) => {
  await abrirQuadro(page);
  await criarMissao(page, "Arrastar missão");

  const origem = page.locator(".board-card", { hasText: "Arrastar missão" });
  const batalha = page.getByRole("region", { name: "Em batalha" });
  await origem.dragTo(batalha);
  await expect(batalha.getByRole("heading", { name: "Arrastar missão" })).toBeVisible();

  await page.getByRole("button", { name: "Recuar" }).focus();
  await page.keyboard.press("Enter");
  const botaoBatalhar = page.getByRole("region", { name: "Missões" }).getByRole("button", { name: "Batalhar" });
  await botaoBatalhar.focus();
  await page.keyboard.press("Enter");
  await expect(batalha.getByRole("heading", { name: "Arrastar missão" })).toBeVisible();
});

test("tema escolhido permanece depois de recarregar", async ({ page }) => {
  await abrirQuadro(page);
  const temaInicial = await page.locator("html").getAttribute("data-theme");
  const temaEsperado = temaInicial === "pergaminho" ? "castelo" : "pergaminho";

  await page.getByRole("button", { name: /^Tema / }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", temaEsperado);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", temaEsperado);
});

for (const [nome, largura, altura] of [["monitor vertical", 768, 1024], ["celular", 390, 844]] as const) {
  test(`${nome} mantém o fluxo utilizável sem rolagem horizontal`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: altura });
    await abrirQuadro(page);
    await criarMissao(page, `Missão ${nome}`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("region", { name: "Missões" }).getByRole("heading", { name: `Missão ${nome}` })).toBeVisible();
    await expect(page.getByText("Pomodoro", { exact: true })).toBeVisible();
  });
}

test("avisos opcionais disparam som e notificação na troca de fase", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    localStorage.setItem("tasksorg:pomodoro-config", JSON.stringify({ focusMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 1, cyclesBeforeLongBreak: 2 }));
    const state = window as unknown as { __tasksorgNotifications: number; __tasksorgTones: number };
    state.__tasksorgNotifications = 0;
    state.__tasksorgTones = 0;

    class AudioContextMock {
      destination = {};
      currentTime = 0;
      resume() { return Promise.resolve(); }
      close() { return Promise.resolve(); }
      createOscillator() {
        return {
          type: "",
          frequency: { value: 0 },
          connect() {},
          start() { state.__tasksorgTones += 1; },
          stop() {},
        };
      }
    }
    class NotificationMock {
      static permission = "granted";
      static requestPermission() { return Promise.resolve("granted"); }
      constructor() { state.__tasksorgNotifications += 1; }
    }
    Object.defineProperty(window, "AudioContext", { value: AudioContextMock, configurable: true });
    Object.defineProperty(window, "Notification", { value: NotificationMock, configurable: true });
  });

  await abrirQuadro(page);
  await criarMissao(page, "Missão com alerta");
  await page.getByRole("button", { name: "Batalhar" }).click();
  await page.getByLabel("Som 8-bit").check();
  await page.getByLabel("Notificações").check();
  await page.getByRole("button", { name: "Iniciar" }).click();
  await page.clock.fastForward("01:01");
  await page.clock.runFor(1_000);

  await expect.poll(() => page.evaluate(() => (window as unknown as { __tasksorgNotifications: number }).__tasksorgNotifications)).toBe(1);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tasksorgTones: number }).__tasksorgTones)).toBe(1);
});
