import { pgPool } from "../../shared/db/pg.js";
import { env } from "../../config/env.js";

type SendResult = {
  providerMessageId?: string;
  responseStatus: number;
  responseBody: unknown;
};

type RecipientTarget = {
  targetType: "group" | "contact";
  targetId: string;
};

const sendTextViaEvolution = async (target: RecipientTarget, text: string): Promise<SendResult> => {
  const requestPayload = {
    number: target.targetId,
    text
  };

  const response = await fetch(`${env.EVOLUTION_BASE_URL}/message/sendText/${env.EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: env.EVOLUTION_API_KEY
    },
    body: JSON.stringify(requestPayload)
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`evolution_send_failed status=${response.status} response=${JSON.stringify(responseBody)}`);
  }

  const providerMessageId =
    typeof responseBody === "object" && responseBody !== null && "key" in responseBody
      ? ((responseBody as { key?: { id?: string } }).key?.id ?? undefined)
      : undefined;

  return {
    providerMessageId,
    responseStatus: response.status,
    responseBody
  };
};

export const dispatchMessageQueueItem = async (messageQueueId: number): Promise<void> => {
  const client = await pgPool.connect();

  try {
    await client.query("begin");

    const itemResult = await client.query<{
      id: number;
      status: "pending" | "processing" | "sent" | "failed";
      recipient_target_type: "group" | "contact";
      recipient_target_id: string;
      message_text: string;
      attempts: number;
      max_attempts: number;
    }>(
      `
      select id, status, recipient_target_type, recipient_target_id, message_text, attempts, max_attempts
      from message_queue
      where id = $1
      for update
      `,
      [messageQueueId]
    );

    const item = itemResult.rows[0];

    if (!item) {
      throw new Error(`message_queue_item_not_found id=${messageQueueId}`);
    }

    if (item.status === "sent") {
      await client.query("commit");
      return;
    }

    await client.query(
      `
      update message_queue
      set status = 'processing', attempts = attempts + 1
      where id = $1
      `,
      [messageQueueId]
    );

    await client.query("commit");

    const sendResult = await sendTextViaEvolution(
      {
        targetType: item.recipient_target_type,
        targetId: item.recipient_target_id
      },
      item.message_text
    );

    await client.query("begin");

    await client.query(
      `
      update message_queue
      set status = 'sent', sent_at = now(), evolution_message_id = $2, last_error = null
      where id = $1
      `,
      [messageQueueId, sendResult.providerMessageId ?? null]
    );

    await client.query(
      `
      insert into delivery_logs (
        message_queue_id,
        request_payload,
        response_status,
        response_body,
        outcome,
        failure_reason
      )
      values ($1, $2::jsonb, $3, $4::jsonb, 'sent', null)
      `,
      [
        messageQueueId,
        JSON.stringify({
          target_type: item.recipient_target_type,
          number: item.recipient_target_id,
          text: item.message_text
        }),
        sendResult.responseStatus,
        JSON.stringify(sendResult.responseBody)
      ]
    );

    await client.query("commit");
  } catch (error: unknown) {
    await client.query("rollback");

    const errorText = error instanceof Error ? error.message : "unknown_dispatch_error";

    await client.query(
      `
      update message_queue
      set
        status = case when attempts >= max_attempts then 'failed' else 'pending' end,
        last_error = $2,
        next_attempt_at = case
          when attempts >= max_attempts then now()
          else now() + ((least(attempts, 5) * 15) || ' seconds')::interval
        end
      where id = $1
      `,
      [messageQueueId, errorText]
    );

    await client.query(
      `
      insert into delivery_logs (
        message_queue_id,
        request_payload,
        response_status,
        response_body,
        outcome,
        failure_reason
      )
      values ($1, '{}'::jsonb, null, '{}'::jsonb, 'failed', $2)
      `,
      [messageQueueId, errorText]
    );

    throw error;
  } finally {
    client.release();
  }
};
