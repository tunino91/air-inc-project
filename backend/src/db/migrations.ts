export interface Migration {
  id: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    id: "001_create_boards",
    sql: `
      CREATE TABLE IF NOT EXISTS boards (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        -- Adjacency-list model: every board optionally points at its direct parent.
        parent_id UUID REFERENCES boards(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Child lookups are the hot path for recursive hierarchy traversal.
      CREATE INDEX IF NOT EXISTS boards_parent_id_idx ON boards(parent_id);
    `,
  },
];
