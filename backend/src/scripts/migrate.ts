import { Database } from "../db/pool";
import { runMigrations } from "../db/runMigrations";

const run = async () => {
  const database = new Database();

  try {
    await runMigrations(database.getPool());
    console.log("Migrations completed successfully.");
  } finally {
    await database.close();
  }
};

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
