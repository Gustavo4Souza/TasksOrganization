import { readFile } from "node:fs/promises";
import pg from "pg";

const { Pool } = pg;
export type DatabasePool = pg.Pool;
export type DatabaseClient = pg.PoolClient;

export function createDatabasePool(connectionString: string): DatabasePool {
  return new Pool({ connectionString, max: 10 });
}

export async function migrate(pool: DatabasePool): Promise<void> {
  const client = await pool.connect();
  try {
    const migrations = ["001_initial.sql", "002_kpis.sql", "003_kpi_quality.sql"];
    for (const [index, name] of migrations.entries()) {
      const version = index + 1;
      const sql = await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8");
      await client.query("BEGIN");
      if (version > 1) {
        const applied = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [version]);
        if (applied.rowCount) { await client.query("ROLLBACK"); continue; }
      }
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version) VALUES ($1) ON CONFLICT DO NOTHING", [version]);
      await client.query("COMMIT");
    }
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* conexão pode já ter encerrado a transação */ }
    throw error;
  } finally {
    client.release();
  }
}
