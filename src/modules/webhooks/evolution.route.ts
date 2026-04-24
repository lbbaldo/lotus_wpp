import type { FastifyInstance } from "fastify";

export const registerEvolutionWebhookRoute = (app: FastifyInstance): void => {
  app.post("/v1/webhooks/evolution", async (_request, reply) => {
    return reply.code(202).send({ status: "accepted" });
  });
};
