import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDatabasePool, migrate } from "./database.js";

const config = loadConfig();
const pool = createDatabasePool(config.databaseUrl);

try {
  await migrate(pool);
  const app = await buildApp(pool, config);
  await app.listen({ host: config.host, port: config.port });

  const shutdown = async () => {
    await app.close();
    await pool.end();
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
} catch (error) {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
}
