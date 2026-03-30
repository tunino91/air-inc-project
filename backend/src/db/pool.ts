import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";

export interface Queryable {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[]
  ) => Promise<QueryResult<T>>;
}

const createQueryable = (target: Pool | PoolClient): Queryable => ({
  query: (text, params) => target.query(text, params as unknown[] | undefined),
});

export class Database {
  private readonly pool: Pool;
  private readonly queryable: Queryable;

  constructor() {
    this.pool = new Pool({
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
    });
    this.queryable = createQueryable(this.pool);
  }

  getPool() {
    // Most repository reads and writes use the shared pool-backed queryable.
    return this.queryable;
  }

  async withTransaction<T>(callback: (client: Queryable) => Promise<T>) {
    const client = await this.pool.connect();
    const queryable = createQueryable(client);

    try {
      // Used for multi-step writes like seed generation so partial trees do not leak on failure.
      await client.query("BEGIN");
      const result = await callback(queryable);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
