import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const MIGRATIONS = join(import.meta.dirname, "../../db/migrations");

/** Fresh in-memory SQLite with every D1 migration applied (same SQL D1 runs). */
export function freshDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  for (const f of readdirSync(MIGRATIONS).filter((n) => n.endsWith(".sql")).sort()) {
    db.exec(readFileSync(join(MIGRATIONS, f), "utf8"));
  }
  return db;
}

/** Minimal D1Database-compatible wrapper so server modules can be tested against SQLite. */
export function asD1(db: DatabaseSync): D1Database {
  const prepare = (sql: string) => {
    let args: unknown[] = [];
    const stmt = {
      bind: (...a: unknown[]) => ((args = a), stmt),
      first: async <T>() => (db.prepare(sql).get(...(args as never[])) as T) ?? null,
      all: async <T>() => ({ results: db.prepare(sql).all(...(args as never[])) as T[], success: true, meta: {} }),
      run: async () => (db.prepare(sql).run(...(args as never[])), { success: true, meta: {} }),
    };
    return stmt;
  };
  return { prepare } as unknown as D1Database;
}
