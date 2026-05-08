import { z } from "zod";

const messageSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, "message must not be empty");

const envelopeSchema = z
  .object({
    event_id: z.string().min(1),
    event_type: z.enum(["pedido_novo", "carga_confirmada", "carregamento_concluido"]),
    occurred_at: z.string().datetime(),
    source: z.literal("lotus"),
    tenant_id: z.string().min(1),
    message: messageSchema
  })
  .strict();

export const lotusEventSchema = envelopeSchema;

export type LotusEvent = z.infer<typeof lotusEventSchema>;
