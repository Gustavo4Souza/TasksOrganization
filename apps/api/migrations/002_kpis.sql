CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY,
  environment varchar(40) NOT NULL,
  version varchar(120) NOT NULL,
  commit_sha varchar(64) NOT NULL,
  status varchar(16) NOT NULL CHECK (status IN ('success', 'failure', 'rollback', 'hotfix')),
  workflow_run_id varchar(80),
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(environment, version, status, completed_at)
);
CREATE INDEX IF NOT EXISTS deployments_completed_at_idx ON deployments(completed_at DESC);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY,
  deployment_id uuid REFERENCES deployments(id) ON DELETE SET NULL,
  title varchar(200) NOT NULL,
  severity varchar(16) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status varchar(16) NOT NULL CHECK (status IN ('open', 'resolved')),
  detected_at timestamptz NOT NULL,
  resolved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'open' AND resolved_at IS NULL) OR (status = 'resolved' AND resolved_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS incidents_detected_at_idx ON incidents(detected_at DESC);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  workflow_run_id varchar(80) PRIMARY KEY,
  commit_sha varchar(64) NOT NULL,
  branch varchar(200) NOT NULL,
  status varchar(16) NOT NULL CHECK (status IN ('success', 'failure', 'cancelled')),
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL,
  tests_total integer CHECK (tests_total >= 0),
  tests_passed integer CHECK (tests_passed >= 0),
  coverage_percentage numeric(5,2) CHECK (coverage_percentage BETWEEN 0 AND 100),
  flaky_tests integer CHECK (flaky_tests >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pipeline_runs_completed_at_idx ON pipeline_runs(completed_at DESC);
