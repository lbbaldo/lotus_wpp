import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { lotusEventSchema } from "../events/events.schema.js";
import { verifyHmacSha256, isTimestampInsideSkew } from "../security/hmac.js";
import { isValidApiKey } from "../security/api-key.js";
import { pgPool } from "../../shared/db/pg.js";
import { buildMessageText } from "../messaging/templates.js";
import { loadRecipientsForEvent } from "../routing/routing.service.js";
import { enqueueDispatchJob } from "../queue/queue.js";

export const registerLotusWebhookRoute = (app: FastifyInstance): void => {
  app.post("/v1/webhooks/lotus/events", async (request, reply) => {
    const apiKey = request.headers["x-lotus-key"];
    const timestamp = request.headers["x-lotus-timestamp"];
    const signature = request.headers["x-lotus-signature"];

    if (!isValidApiKey(typeof apiKey === "string" ? apiKey : undefined, env.LOTUS_WEBHOOK_API_KEY)) {
      return reply.code(401).send({ error: "invalid_api_key" });
    }

    if (typeof timestamp !== "string" || !isTimestampInsideSkew(timestamp, env.LOTUS_WEBHOOK_MAX_SKEW_SECONDS)) {
      return reply.code(401).send({ error: "invalid_or_stale_timestamp" });
    }

    const rawBody = JSON.stringify(request.body ?? {});

    if (
      typeof signature !== "string" ||
      !verifyHmacSha256({
        rawBody,
        timestamp,
        signatureHeader: signature,
        secret: env.LOTUS_WEBHOOK_HMAC_SECRET
      })
    ) {
      return reply.code(401).send({ error: "invalid_signature" });
    }

    const parsed = lotusEventSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        details: parsed.error.flatten()
      });
    }

    const event = parsed.data;
    const idempotencyKey = `${event.event_type}:${event.event_id}`;

    const client = await pgPool.connect();

    try {
      await client.query("begin");

      const insertEventResult = await client.query<{ id: number }>(
        `
        insert into incoming_events (
          event_id,
          event_type,
          idempotency_key,
          payload,
          status
        )
        values ($1, $2, $3, $4::jsonb, 'accepted')
        on conflict (idempotency_key) do nothing
        returning id
        `,
        [event.event_id, event.event_type, idempotencyKey, JSON.stringify(event)]
      );

      const insertedEvent = insertEventResult.rows[0];

      if (!insertedEvent) {
        await client.query("commit");
        return reply.code(202).send({ status: "ignored_duplicate", event_id: event.event_id });
      }

      const recipients = await loadRecipientsForEvent(client, event);
      const messageText = buildMessageText(event);

      const queueIds: number[] = [];

      for (const recipient of recipients) {
        const queueInsert = await client.query<{ id: number }>(
          `
          insert into message_queue (
            incoming_event_id,
            recipient_target_type,
            recipient_target_id,
            message_text,
            status,
            max_attempts
          )
          values ($1, $2, $3, $4, 'pending', $5)
          returning id
          `,
          [insertedEvent.id, recipient.targetType, recipient.targetId, messageText, env.QUEUE_MAX_ATTEMPTS]
        );

        const queueId = queueInsert.rows[0]?.id;
        if (!queueId) {
          throw new Error(`queue_insert_failed incoming_event_id=${insertedEvent.id}`);
        }
        queueIds.push(queueId);
      }

      await client.query("commit");

      await Promise.all(
        queueIds.map(async (messageQueueId) => {
          await enqueueDispatchJob(messageQueueId);
        })
      );

      return reply.code(202).send({
        status: "accepted",
        event_id: event.event_id,
        enqueued_messages: queueIds.length
      });
    } catch (error: unknown) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  });
};
