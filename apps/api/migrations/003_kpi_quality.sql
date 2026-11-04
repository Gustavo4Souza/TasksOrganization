ALTER TABLE pipeline_runs
  ADD COLUMN IF NOT EXISTS first_commit_at timestamptz;

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS escaped_defect boolean NOT NULL DEFAULT true;
