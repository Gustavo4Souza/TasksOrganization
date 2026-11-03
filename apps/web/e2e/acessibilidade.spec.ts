import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ROTAS = ["/", "/foco", "/login", "/cadastro", "/kpis", "/design", "/design/kpis"];
const TEMAS = ["castelo", "pergaminho"] as const;

async function violacoesGraves(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join(" | ")}`);
}

for (const tema of TEMAS) {
  test.describe(`tema ${tema}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("tasksorg:theme", t), tema);
    });

    for (const rota of ROTAS) {
      test(`${rota} sem violações sérias`, async ({ page }) => {
        await page.goto(rota);
        await page.waitForLoadState("networkidle");
        await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
        expect(await violacoesGraves(page)).toEqual([]);
      });
    }

    test("Quadro com missões nos três estados sem violações sérias", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("button", { name: "Criar" })).toBeEnabled();
      for (const titulo of ["Fazer", "Batalhar", "Concluir"]) {
        await page.getByRole("textbox", { name: "Nova missão" }).fill(titulo);
        await page.getByRole("button", { name: "Criar" }).click();
      }
      await page.getByRole("button", { name: "Batalhar" }).nth(1).click();
      await page.getByRole("button", { name: "Concluir" }).nth(2).click();
      await expect(page.getByRole("region", { name: "Conquistas" }).getByRole("heading")).toHaveCount(2);
      expect(await violacoesGraves(page)).toEqual([]);
    });
  });
}
