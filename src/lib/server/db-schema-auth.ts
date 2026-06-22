export function authSchemaSql(now: number): string {
  return `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('user', 'developer')),
      clerk_user_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
      created_at TEXT NOT NULL
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled'));
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'cargo_staff', 'travel_staff', 'esim_staff', 'finance_staff', 'support_staff', 'customer')),
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, role)
    );
    CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles (role);
    CREATE TABLE IF NOT EXISTS role_invites (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      roles TEXT NOT NULL,
      invited_by_email TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
      created_at TEXT NOT NULL,
      accepted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS role_invites_email_idx ON role_invites (email);
    CREATE INDEX IF NOT EXISTS role_invites_status_idx ON role_invites (status);
    CREATE TABLE IF NOT EXISTS login_codes (email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at BIGINT NOT NULL);
    CREATE INDEX IF NOT EXISTS login_codes_email_idx ON login_codes (email);
    CREATE UNIQUE INDEX IF NOT EXISTS login_codes_email_unique_idx ON login_codes (email);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at BIGINT NOT NULL);
    DELETE FROM rate_limits WHERE reset_at <= ${now};
    CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits (reset_at);
  `
}
