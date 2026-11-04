import { expect, test } from "@playwright/test";

test("migra missões locais e reenvia alterações feitas offline", async ({ page }) => {
  test.skip(!process.env.E2E_API_URL, "Requer a API real do ambiente E2E.");
  const email = `e2e-${Date.now()}@tasksorg.test`;

  await page.goto("/");
  await page.getByLabel("Nova missão").fill("Missão anterior à conta");
  await page.getByRole("button", { name: "Criar", exact: true }).click();
  await expect(page.getByText("Missão anterior à conta")).toBeVisible();

  await page.goto("/cadastro");
  await page.getByLabel("Nome do aventureiro").fill("E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-e2e-segura");
  await page.getByLabel("Confirmar senha").fill("senha-e2e-segura");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Missão anterior à conta")).toBeVisible();

  await page.evaluate(() => {
    localStorage.removeItem("tasksorg:tasks");
    localStorage.removeItem("tasksorg:sync-queue");
  });
  await page.reload();
  await expect(page.getByText("Missão anterior à conta")).toBeVisible();

  await page.goto("/kpis");
  await expect(page.getByText("Dados reais")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Saúde da entrega" })).toBeVisible();
  await page.goto("/");

  await page.route("http://localhost:3001/**", (route) => route.abort());
  await page.getByLabel("Nova missão").fill("Missão criada offline");
  await page.getByRole("button", { name: "Criar", exact: true }).click();
  await expect(page.getByText("Missão criada offline")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tasksorg:sync-queue") ?? "[]").length)).toBe(1);
  await page.unroute("http://localhost:3001/**");
  await page.reload();
  await expect(page.getByText("Missão criada offline")).toBeVisible();

  await page.evaluate(() => localStorage.removeItem("tasksorg:tasks"));
  await page.reload();
  await expect(page.getByText("Missão criada offline")).toBeVisible();
});
