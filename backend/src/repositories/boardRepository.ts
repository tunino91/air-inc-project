import { Queryable } from "../db/pool";
import { BoardRecord } from "../types/board";

interface BoardRow {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
}

const mapRow = (row: BoardRow): BoardRecord => ({
  id: row.id,
  name: row.name,
  parentId: row.parent_id,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export class BoardRepository {
  constructor(private readonly db: Queryable) {}

  async getAllBoards() {
    const result = await this.db.query<BoardRow>(
      `
        SELECT id, name, parent_id, created_at, updated_at
        FROM boards
        ORDER BY created_at ASC, name ASC
      `
    );

    return result.rows.map(mapRow);
  }

  async findById(id: string) {
    const result = await this.db.query<BoardRow>(
      `
        SELECT id, name, parent_id, created_at, updated_at
        FROM boards
        WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async insertBoard(input: { id: string; name: string; parentId: string | null }) {
    const result = await this.db.query<BoardRow>(
      `
        INSERT INTO boards (id, name, parent_id)
        VALUES ($1, $2, $3)
        RETURNING id, name, parent_id, created_at, updated_at
      `,
      [input.id, input.name, input.parentId]
    );

    return mapRow(result.rows[0]);
  }

  async updateBoardParent(id: string, parentId: string | null) {
    const result = await this.db.query<BoardRow>(
      `
        UPDATE boards
        SET parent_id = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, parent_id, created_at, updated_at
      `,
      [id, parentId]
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async deleteBoard(id: string) {
    await this.db.query("DELETE FROM boards WHERE id = $1", [id]);
  }

  async getBoardDepth(id: string) {
    const result = await this.db.query<{ depth: string }>(
      `
        WITH RECURSIVE ancestors AS (
          -- Start at the requested board.
          SELECT id, parent_id, 1 AS depth
          FROM boards
          WHERE id = $1

          UNION ALL

          -- Walk upward from child to parent until the root is reached.
          SELECT b.id, b.parent_id, ancestors.depth + 1
          FROM boards b
          INNER JOIN ancestors ON ancestors.parent_id = b.id
        )
        SELECT MAX(depth)::TEXT AS depth
        FROM ancestors
      `,
      [id]
    );

    return result.rows[0]?.depth ? Number(result.rows[0].depth) : null;
  }

  async getSubtreeHeight(id: string) {
    const result = await this.db.query<{ height: string }>(
      `
        WITH RECURSIVE subtree AS (
          -- Start at the subtree root.
          SELECT id, 1 AS height
          FROM boards
          WHERE id = $1

          UNION ALL

          -- Walk downward through every descendant to find the deepest branch.
          SELECT b.id, subtree.height + 1
          FROM boards b
          INNER JOIN subtree ON b.parent_id = subtree.id
        )
        SELECT MAX(height)::TEXT AS height
        FROM subtree
      `,
      [id]
    );

    return result.rows[0]?.height ? Number(result.rows[0].height) : null;
  }

  async isDescendant(ancestorId: string, candidateId: string) {
    const result = await this.db.query<{ exists: boolean }>(
      `
        WITH RECURSIVE subtree AS (
          -- Build the full descendant set for the proposed ancestor.
          SELECT id
          FROM boards
          WHERE id = $1

          UNION ALL

          SELECT b.id
          FROM boards b
          INNER JOIN subtree ON b.parent_id = subtree.id
        )
        -- If the candidate appears anywhere in that subtree, the move would create a cycle.
        SELECT EXISTS(
          SELECT 1
          FROM subtree
          WHERE id = $2
        ) AS exists
      `,
      [ancestorId, candidateId]
    );

    return result.rows[0]?.exists ?? false;
  }

  async listSubtreeIds(id: string) {
    const result = await this.db.query<{ id: string }>(
      `
        WITH RECURSIVE subtree AS (
          -- Collect every node that will be removed by the cascading delete.
          SELECT id
          FROM boards
          WHERE id = $1

          UNION ALL

          SELECT b.id
          FROM boards b
          INNER JOIN subtree ON b.parent_id = subtree.id
        )
        SELECT id
        FROM subtree
      `,
      [id]
    );

    return result.rows.map((row: { id: string }) => row.id);
  }
}
