import { expect, test, type Page } from "@playwright/test";

const coluna = (page: Page, nome: "Missões" | "Em batalha" | "Conquistas") => page.getByRole("region", { name: nome });

async function criarMissao(page: Page, titulo: string) {
  await page.getByRole("textbox", { name: "Nova missão" }).fill(titulo);
  await page.getByRole("button", { name: "Criar" }).click();
  await expect(page.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
}

async function abrirQuadro(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Criar" })).toBeEnabled();
}

test("criar, batalhar e concluir uma missão, mantendo tudo ao recarregar", async ({ page }) => {
  await abrirQuadro(page);
  await criarMissao(page, "Preparar apresentação");
  await expect(coluna(page, "Missões").getByRole("heading", { name: "Preparar apresentação" })).toBeVisible();

  await page.getByRole("button", { name: "Batalhar" }).click();
  await expect(coluna(page, "Em batalha").getByRole("heading", { name: "Preparar apresentação" })).toBeVisible();

  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(coluna(page, "Conquistas").getByRole("heading", { name: "Preparar apresentação" })).toBeVisible();

  await page.reload();
  await expect(coluna(page, "Conquistas").getByRole("heading", { name: "Preparar apresentação" })).toBeVisible();
});

test("só uma missão fica em batalha por vez", async ({ page }) => {
  await abrirQuadro(page);
  await criarMissao(page, "Primeira");
  await criarMissao(page, "Segunda");

  await coluna(page, "Missões").getByRole("button", { name: "Batalhar" }).first().click();
  await expect(coluna(page, "Em batalha").getByRole("heading")).toHaveCount(2); // título da coluna + missão
  await coluna(page, "Missões").getByRole("button", { name: "Batalhar" }).first().click();

  await expect(coluna(page, "Em batalha").getByRole("heading")).toHaveCount(2);
  await expect(coluna(page, "Missões").getByRole("heading")).toHaveCount(2);
});

test("o fim de um Foco troca de fase e credita a missão em batalha", async ({ page }) => {
  await page.clock.install();
  await abrirQuadro(page);
  await criarMissao(page, "Estudar");
  await page.getByRole("button", { name: "Batalhar" }).click();
  await expect(coluna(page, "Em batalha").getByRole("heading", { name: "Estudar" })).toBeVisible();

  await page.getByRole("button", { name: "Iniciar" }).click();
  await page.clock.fastForward("25:01");
  await page.clock.runFor(2_000);

  await expect(page.locator(".px-pomo-phase")).toContainText(/save point/i);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tasksorg:tasks") ?? "{}").tasks?.[0]?.pomodoros))
    .toBe(1);
});

for (const [largura, altura] of [[1280, 720], [1440, 900], [1920, 1080]] as const) {
  test.describe(`tela ${largura}x${altura}`, () => {
    test.use({ viewport: { width: largura, height: altura } });

    async function esperarSemRolagem(page: Page) {
      const medida = await page.evaluate(() => ({
        altura: document.documentElement.scrollHeight - window.innerHeight,
        largura: document.documentElement.scrollWidth - window.innerWidth,
      }));
      expect(medida).toEqual({ altura: 0, largura: 0 });
    }

    test("o Quadro vazio não tem rolagem", async ({ page }) => {
      await abrirQuadro(page);
      await esperarSemRolagem(page);
    });

    test("o Quadro cheio não tem rolagem", async ({ page }) => {
      await abrirQuadro(page);
      for (let i = 1; i <= 11; i++) await criarMissao(page, `Missão ${i}`);
      // a 12ª fica recolhida em "+1 missões", como previsto na densidade adaptativa
      await page.getByRole("textbox", { name: "Nova missão" }).fill("Missão 12");
      await page.getByRole("button", { name: "Criar" }).click();
      await expect(page.getByText("+1 missões")).toBeVisible();
      await esperarSemRolagem(page);
    });
  });
}
