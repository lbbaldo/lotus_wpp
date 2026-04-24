import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./shared/logger/logger.js";

const start = async (): Promise<void> => {
  const app = buildApp();

  await app.listen({
    port: env.PORT,
    host: "0.0.0.0"
  });

  logger.info({ port: env.PORT }, "server_started");
};

start().catch((error: unknown) => {
  logger.error({ error }, "server_start_failed");
  process.exit(1);
});
