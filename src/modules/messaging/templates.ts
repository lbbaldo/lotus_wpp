import type { LotusEvent } from "../events/events.schema.js";

const formatDateBr = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const formatNumberPtBr = (value: number): string => {
  return value.toLocaleString("pt-BR");
};

const formatStrech = (value: boolean): string => {
  return value ? "sim" : "nao";
};

export const buildMessageText = (event: LotusEvent): string => {
  if (event.event_type === "pedido_novo") {
    return [
      "Novo pedido recebido no Lotus.",
      `Pedido: ${event.data.pedido_id}`,
      `Cliente: ${event.data.cliente}`,
      `Origem: ${event.data.cidade_origem}`,
      `Destino: ${event.data.cidade_destino}`,
      `Entrega prevista: ${event.data.data_prevista_entrega}`
    ].join("\n");
  }

  if (event.event_type === "carga_confirmada") {
    const header = `Carregamento confirmado ${formatDateBr(event.data.data_carga)} para ${event.data.cliente}`;

    return [
      header,
      `Produto: ${event.data.produto}`,
      `Peso: ${formatNumberPtBr(event.data.peso_kg)} kg`,
      `Quantidade: ${formatNumberPtBr(event.data.quantidade)}`,
      `Strech: ${formatStrech(event.data.strech)}`,
      `Motorista: ${event.data.motorista_nome}`,
      `Placa: ${event.data.placa_caminhao}`,
      event.data.pedido_id ? `Pedido: ${event.data.pedido_id}` : null
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  }

  return [
    "Carregamento concluido.",
    `Cliente: ${event.data.cliente}`,
    event.data.pedido_id ? `Pedido: ${event.data.pedido_id}` : null,
    `Carga: ${event.data.carga_id}`,
    `Concluido em: ${formatDateBr(event.data.carregado_em)}`
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
};
