-- Generic fixed-window rate limiting (lead form, later login).
-- key examples: 'lead:<ip-hash>', 'login:<email>'
CREATE TABLE rate_limits (
  key           TEXT PRIMARY KEY,
  hits          INTEGER NOT NULL DEFAULT 0,
  window_start  TEXT NOT NULL
);

-- login_attempts from 0001 is superseded by rate_limits.
DROP TABLE IF EXISTS login_attempts;
