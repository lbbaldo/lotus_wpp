import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pgPool } from "./pg.js";
import { logger } from "../logger/logger.js";

const resolveMigrationsDir = (): string => {
  const isDistRuntime = import.meta.url.includes("/dist/");
  return isDistRuntime
    ? join(process.cwd(), "dist/shared/db/migrations")
    : join(process.cwd(), "src/shared/db/migrations");
};

const run = async (): Promise<void> => {
  const migrationsDir = resolveMigrationsDir();
  const files = (await readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const fileName of files) {
    const sql = await readFile(join(migrationsDir, fileName), "utf8");
    await pgPool.query(sql);
    logger.info({ fileName }, "migration_completed");
  }

  await pgPool.end();
};

run().catch((error: unknown) => {
  logger.error({ error }, "migration_failed");
  process.exit(1);
});
