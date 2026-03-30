import { Queryable } from "./pool";
import { migrations } from "./migrations";

export const runMigrations = async (db: Queryable) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const migration of migrations) {
    const existing = await db.query<{ id: string }>(
      "SELECT id FROM schema_migrations WHERE id = $1",
      [migration.id]
    );

    if (existing.rowCount) {
      // Skip migrations that have already been recorded as applied.
      continue;
    }

    await db.query(migration.sql);
    await db.query("INSERT INTO schema_migrations (id) VALUES ($1)", [
      migration.id,
    ]);
  }
};
