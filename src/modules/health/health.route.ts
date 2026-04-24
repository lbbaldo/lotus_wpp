import type { FastifyInstance } from "fastify";
import { Redis } from "ioredis";
import { pgPool } from "../../shared/db/pg.js";
import { env } from "../../config/env.js";

export const registerHealthRoute = (app: FastifyInstance): void => {
  const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });

  app.get("/health", async (_request, reply) => {
    try {
      await pgPool.query("select 1");
      await redis.connect();
      await redis.ping();
      await redis.disconnect();

      return reply.code(200).send({ status: "ok", db: "ok", redis: "ok" });
    } catch (error: unknown) {
      return reply.code(503).send({
        status: "degraded",
        reason: error instanceof Error ? error.message : "unknown_health_error"
      });
    }
  });
};
