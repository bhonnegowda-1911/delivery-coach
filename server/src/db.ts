import pg from 'pg'

// Postgres access for the platform. One pool, shared by every feature module. The schema is
// intentionally generic: `sessions` holds any kind of activity/analysis as a jsonb payload
// (so new features need no schema change), and `assets` holds metadata for every binary
// (the bytes live in object storage — see storage.ts). User scoping (`user_id`) is a
// documented future column; today this is a single-user, local deployment.

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/delivery_coach'

export const pool = new pg.Pool({ connectionString: DATABASE_URL })

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id           uuid PRIMARY KEY,
  kind         text NOT NULL,
  status       text NOT NULL,
  title        text,
  level        text,
  payload      jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS sessions_kind_idx ON sessions (kind);
CREATE INDEX IF NOT EXISTS sessions_updated_idx ON sessions (updated_at DESC);

CREATE TABLE IF NOT EXISTS assets (
  id            uuid PRIMARY KEY,
  session_id    uuid REFERENCES sessions(id) ON DELETE SET NULL,
  kind          text NOT NULL,
  object_key    text NOT NULL,
  content_type  text,
  size_bytes    bigint,
  original_name text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_session_idx ON assets (session_id);
`

/** Create tables if they don't exist. No migration tool yet — additive DDL only. */
export async function initSchema(): Promise<void> {
  await pool.query(SCHEMA)
}
