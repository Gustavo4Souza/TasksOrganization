export interface ApiConfig {
  databaseUrl: string;
  host: string;
  port: number;
  allowedOrigins: string[];
  sessionDays: number;
  secureCookies: boolean;
  kpiIngestSecret?: string;
  /** Quantos proxies confiar (ex.: o balanceador do Render), para o rate limit usar o IP real do cliente. */
  trustProxy: boolean | number;
}

function parseTrustProxy(value: string | undefined): boolean | number {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "false" || normalized === "0") return false;
  if (normalized === "true") return true;
  const hops = Number(normalized);
  if (!Number.isInteger(hops) || hops < 0) throw new Error("TRUST_PROXY inválida: use true, false ou o número de proxies.");
  return hops;
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
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
  };
}
