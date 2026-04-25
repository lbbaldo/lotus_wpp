import type { FastifyInstance } from "fastify";
import { Redis } from "ioredis";
import { pgPool } from "../../shared/db/pg.js";
import { env } from "../../config/env.js";
import { isValidApiKey } from "../security/api-key.js";

type HealthCheckStatus = "ok" | "error";

type EvolutionConnectionStateResponse = {
  instance?: {
    instanceName?: string;
    state?: string;
  };
};

type DetailedHealthResponse = {
  ok: boolean;
  service: "whatsapp-bot";
  status: "online" | "degraded";
  db: HealthCheckStatus;
  redis: HealthCheckStatus;
  evolution_api: HealthCheckStatus;
  whatsapp_connected: boolean | null;
  whatsapp_state: string | null;
  timestamp: string;
};

const EVOLUTION_HEALTH_TIMEOUT_MS = 5000;

const checkDb = async (): Promise<HealthCheckStatus> => {
  try {
    await pgPool.query("select 1");
    return "ok";
  } catch {
    return "error";
  }
};

const checkRedis = async (): Promise<HealthCheckStatus> => {
  const redis = new Redis(env.REDIS_URL, {
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null
  });

  try {
    await redis.connect();
    await redis.ping();
    return "ok";
  } catch {
    return "error";
  } finally {
    redis.disconnect();
  }
};

const getEvolutionConnectionState = async (): Promise<{
  status: HealthCheckStatus;
  whatsappConnected: boolean | null;
  whatsappState: string | null;
}> => {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), EVOLUTION_HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${env.EVOLUTION_BASE_URL}/instance/connectionState/${env.EVOLUTION_INSTANCE}`,
      {
        method: "GET",
        headers: {
          apikey: env.EVOLUTION_API_KEY
        },
        signal: controller.signal
      }
    );

    const responseBody = (await response.json().catch(() => ({}))) as EvolutionConnectionStateResponse;
    const whatsappState =
      typeof responseBody.instance?.state === "string" ? responseBody.instance.state : null;

    if (!response.ok) {
      return {
        status: "error",
        whatsappConnected: null,
        whatsappState
      };
    }

    return {
      status: "ok",
      whatsappConnected: whatsappState === "open",
      whatsappState
    };
  } catch {
    return {
      status: "error",
      whatsappConnected: null,
      whatsappState: null
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const buildDetailedHealth = async (): Promise<DetailedHealthResponse> => {
  const [dbStatus, redisStatus, evolutionStatus] = await Promise.all([
    checkDb(),
    checkRedis(),
    getEvolutionConnectionState()
  ]);

  const ok =
    dbStatus === "ok" &&
    redisStatus === "ok" &&
    evolutionStatus.status === "ok" &&
    evolutionStatus.whatsappConnected === true;

  return {
    ok,
    service: "whatsapp-bot",
    status: ok ? "online" : "degraded",
    db: dbStatus,
    redis: redisStatus,
    evolution_api: evolutionStatus.status,
    whatsapp_connected: evolutionStatus.whatsappConnected,
    whatsapp_state: evolutionStatus.whatsappState,
    timestamp: new Date().toISOString()
  };
};

export const registerHealthRoute = (app: FastifyInstance): void => {
  app.get("/health", async (_request, reply) => {
    const [dbStatus, redisStatus] = await Promise.all([checkDb(), checkRedis()]);
    const ok = dbStatus === "ok" && redisStatus === "ok";

    return reply.code(ok ? 200 : 503).send({
      status: ok ? "ok" : "degraded",
      db: dbStatus,
      redis: redisStatus
    });
  });

  app.get("/v1/health", async (request, reply) => {
    const apiKey = request.headers["x-lotus-key"];

    if (!isValidApiKey(typeof apiKey === "string" ? apiKey : undefined, env.LOTUS_WEBHOOK_API_KEY)) {
      return reply.code(401).send({ error: "invalid_api_key" });
    }

    const health = await buildDetailedHealth();
    return reply.code(health.ok ? 200 : 503).send(health);
  });
};
