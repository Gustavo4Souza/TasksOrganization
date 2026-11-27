-- Medições dos KPIs de segurança e operação (SAST, dependências, secret scanning,
-- disponibilidade, erros, latência e operações críticas). Cada fonte envia uma
-- medição pontual por /internal/kpis/measurements; a API agrega no período.
CREATE TABLE IF NOT EXISTS kpi_measurements (
  id uuid PRIMARY KEY,
  metric_id varchar(60) NOT NULL,
  value numeric(14, 4) NOT NULL CHECK (value >= 0),
  measured_at timestamptz NOT NULL,
  source varchar(80) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric_id, source, measured_at)
);

CREATE INDEX IF NOT EXISTS kpi_measurements_metric_measured_at_idx
  ON kpi_measurements (metric_id, measured_at DESC);
