// Entrada da API na Vercel: roda o mesmo app Fastify do server.ts como função.
// Cada instância da função cria o app uma vez (e aplica as migrações) e o reaproveita
// nas próximas requisições; o vercel.json manda todos os caminhos para cá.
import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createDatabasePool, migrate } from "../src/database.js";

let appPromise: Promise<FastifyInstance> | undefined;

async function createApp(): Promise<FastifyInstance> {
  const config = loadConfig();
  const pool = createDatabasePool(config.databaseUrl);
  await migrate(pool);
  const app = await buildApp(pool, config);
  await app.ready();
  return app;
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  appPromise ??= createApp().catch((error: unknown) => {
    // Falhou ao subir (ex.: banco fora do ar): a próxima requisição tenta de novo.
    appPromise = undefined;
    throw error;
  });
  const app = await appPromise;
  app.server.emit("request", request, response);
}
