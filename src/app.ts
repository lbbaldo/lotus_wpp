import Fastify from "fastify";
import { logger } from "./shared/logger/logger.js";
import { registerHealthRoute } from "./modules/health/health.route.js";
import { registerLotusWebhookRoute } from "./modules/webhooks/lotus.route.js";
import { registerEvolutionWebhookRoute } from "./modules/webhooks/evolution.route.js";
import { registerAdminReprocessRoute } from "./modules/admin/reprocess.route.js";

export const buildApp = () => {
  const app = Fastify({
    logger: false
  });

  app.setErrorHandler((error, _request, reply) => {
    logger.error({ error }, "unhandled_request_error");
    reply.code(500).send({ error: "internal_server_error" });
  });

  registerHealthRoute(app);
  registerLotusWebhookRoute(app);
  registerEvolutionWebhookRoute(app);
  registerAdminReprocessRoute(app);

  return app;
};
