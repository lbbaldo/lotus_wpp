import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { pgPool } from "../../shared/db/pg.js";
import { enqueueDispatchJob } from "../queue/queue.js";

export const registerAdminReprocessRoute = (app: FastifyInstance): void => {
  app.post("/v1/admin/reprocess/:messageQueueId", async (request, reply) => {
    if (!env.ADMIN_API_KEY) {
      return reply.code(404).send({ error: "admin_route_not_enabled" });
    }

    const adminKey = request.headers["x-admin-key"];
    if (typeof adminKey !== "string" || adminKey !== env.ADMIN_API_KEY) {
      return reply.code(401).send({ error: "invalid_admin_key" });
    }

    const messageQueueIdRaw = (request.params as { messageQueueId?: string }).messageQueueId;
    const messageQueueId = Number(messageQueueIdRaw);

    if (!Number.isInteger(messageQueueId) || messageQueueId <= 0) {
      return reply.code(400).send({ error: "invalid_message_queue_id" });
    }

    const client = await pgPool.connect();

    try {
      await client.query("begin");

      const found = await client.query<{ id: number; status: "pending" | "processing" | "sent" | "failed" }>(
        `
        select id, status
        from message_queue
        where id = $1
        for update
        `,
        [messageQueueId]
      );

      const item = found.rows[0];

      if (!item) {
        await client.query("rollback");
        return reply.code(404).send({ error: "message_queue_item_not_found" });
      }

      if (item.status === "sent") {
        await client.query("rollback");
        return reply.code(409).send({ error: "message_already_sent" });
      }

      await client.query(
        `
        update message_queue
        set status = 'pending', next_attempt_at = now(), last_error = null
        where id = $1
        `,
        [messageQueueId]
      );

      await client.query("commit");

      await enqueueDispatchJob(messageQueueId);

      return reply.code(202).send({
        status: "reprocess_enqueued",
        message_queue_id: messageQueueId
      });
    } catch (error: unknown) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  });
};
