import type { LotusEvent } from "../events/events.schema.js";

export const buildMessageText = (event: LotusEvent): string => {
  return event.message;
};
