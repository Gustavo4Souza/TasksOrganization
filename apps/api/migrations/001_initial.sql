CREATE TABLE IF NOT EXISTS schema_migrations (
  version integer PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  name varchar(80) NOT NULL,
  email varchar(254) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id varchar(80) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(160) NOT NULL,
  description text,
  scope varchar(16) NOT NULL CHECK (scope IN ('daily', 'weekly', 'yearly')),
  status varchar(16) NOT NULL CHECK (status IN ('todo', 'doing', 'done')),
  priority varchar(16) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  due_date date,
  pomodoros integer NOT NULL DEFAULT 0 CHECK (pomodoros >= 0),
  completed_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS tasks_one_battle_per_user_idx ON tasks(user_id) WHERE status = 'doing';

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id varchar(80) REFERENCES tasks(id) ON DELETE SET NULL,
  phase varchar(16) NOT NULL CHECK (phase IN ('focus', 'shortBreak', 'longBreak')),
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS pomodoro_sessions_user_id_idx ON pomodoro_sessions(user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS daily_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress_date date NOT NULL,
  completed_count integer NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
  focus_count integer NOT NULL DEFAULT 0 CHECK (focus_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, progress_date)
);
