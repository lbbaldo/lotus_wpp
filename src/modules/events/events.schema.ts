import { z } from "zod";

const envelopeSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.enum(["pedido_novo", "carga_confirmada", "carregamento_concluido"]),
  occurred_at: z.string().datetime(),
  source: z.literal("lotus"),
  tenant_id: z.string().min(1),
  data: z.record(z.unknown())
});

export const pedidoNovoSchema = envelopeSchema.extend({
  event_type: z.literal("pedido_novo"),
  data: z
    .object({
      pedido_id: z.string().min(1),
      cliente: z.string().min(1),
      cidade_origem: z.string().min(1),
      cidade_destino: z.string().min(1),
      data_prevista_entrega: z.string().min(1)
    })
    .strict()
});

export const cargaConfirmadaSchema = envelopeSchema.extend({
  event_type: z.literal("carga_confirmada"),
  data: z
    .object({
      carga_id: z.string().min(1),
      pedido_id: z.string().min(1).nullable(),
      cliente: z.string().min(1),
      motorista_nome: z.string().min(1),
      placa_caminhao: z.string().min(1),
      data_carga: z.string().min(1),
      produto: z.string().min(1),
      peso_kg: z.coerce.number().positive(),
      quantidade: z.coerce.number().positive(),
      strech: z.boolean()
    })
    .strict()
});

export const carregamentoConcluidoSchema = envelopeSchema.extend({
  event_type: z.literal("carregamento_concluido"),
  data: z
    .object({
      carga_id: z.string().min(1),
      pedido_id: z.string().min(1).nullable(),
      cliente: z.string().min(1),
      carregado_em: z.string().datetime()
    })
    .strict()
});

export const lotusEventSchema = z.discriminatedUnion("event_type", [
  pedidoNovoSchema,
  cargaConfirmadaSchema,
  carregamentoConcluidoSchema
]);

export type LotusEvent = z.infer<typeof lotusEventSchema>;
