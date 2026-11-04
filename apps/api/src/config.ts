export interface ApiConfig {
  databaseUrl: string;
  host: string;
  port: number;
  allowedOrigins: string[];
  sessionDays: number;
  secureCookies: boolean;
  kpiIngestSecret?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL é obrigatória.");
  const port = Number(env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("PORT inválida.");
  return {
    databaseUrl,
    host: env.HOST?.trim() || "0.0.0.0",
    port,
    allowedOrigins: (env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",").map((value) => value.trim()).filter(Boolean),
    sessionDays: 30,
    secureCookies: env.NODE_ENV === "production",
    kpiIngestSecret: env.KPI_INGEST_SECRET?.trim() || undefined,
  };
}
