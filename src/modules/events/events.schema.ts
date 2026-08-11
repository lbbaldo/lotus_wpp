import { z } from "zod";

const messageSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, "message must not be empty");

const LOTUS_ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const SODEX_ORGANIZATION_ID = "22222222-2222-4222-8222-222222222222";

const commonEnvelopeShape = {
  event_id: z.string().uuid(),
  event_type: z.enum(["pedido_novo", "carga_confirmada", "carregamento_concluido"]),
  occurred_at: z.string().datetime(),
  message: messageSchema
};

const envelopeSchema = z.discriminatedUnion("source", [
  z
    .object({
      ...commonEnvelopeShape,
      source: z.literal("lotus"),
      tenant_id: z.literal(LOTUS_ORGANIZATION_ID)
    })
    .strict(),
  z
    .object({
      ...commonEnvelopeShape,
      source: z.literal("sodex"),
      tenant_id: z.literal(SODEX_ORGANIZATION_ID)
    })
    .strict()
]);

export const lotusEventSchema = envelopeSchema;

export type LotusEvent = z.infer<typeof lotusEventSchema>;
