import type { PoolClient } from "pg";
import type { LotusEvent } from "../events/events.schema.js";

type Recipient = {
  targetType: "group" | "contact";
  targetId: string;
};

export const loadRecipientsForEvent = async (client: PoolClient, event: LotusEvent): Promise<Recipient[]> => {
  const result = await client.query<{ target_type: "group" | "contact"; target_id: string }>(
    `
    select target_type, target_id
    from alert_recipients
    where alert_type = $1 and active = true
    `,
    [event.event_type]
  );

  return result.rows.map((row) => ({ targetType: row.target_type, targetId: row.target_id }));
};
