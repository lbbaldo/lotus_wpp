# Mapeamento Preliminar Lotus -> Bot WhatsApp

Data da inspeção: 2026-04-23
Modo de acesso: somente leitura

## Resultado geral

Mapeamento dos eventos do MVP encontrado com boa aderência:

- `pedido_novo`: usar `comercial.pedido_eventos`
- `carga_confirmada`: usar `public.carregamentos`
- `carregamento_concluido`: usar `public.carregamentos`

## Fontes recomendadas por evento

## 1) pedido_novo

Fonte principal:
- `comercial.pedido_eventos` com `tipo_evento = 'PEDIDO_CRIADO'`

Campos úteis:
- `pedido_eventos.pedido_id` -> id técnico
- `pedido_eventos.created_at` -> momento do evento
- join com `comercial.pedidos` por `pedidos.id = pedido_eventos.pedido_id`

Payload alvo:
- `pedido_id`: `pedidos.numero` (fallback: `pedidos.id`)
- `cliente`: `pedidos.cliente_snapshot_nome`
- `cidade_origem`: pendente (não identificado claramente)
- `cidade_destino`: `pedidos.entrega_municipio`
- `data_prevista_entrega`: `pedidos.entrega_data`

## 2) carga_confirmada

Fonte principal:
- `public.carregamentos` com `status = 'confirmado'`

Campos úteis:
- `id` -> carga_id
- `pedido_id`
- `cliente`
- `motorista`
- `placa`
- `data`
- `created_at`

Payload alvo:
- `carga_id`: `carregamentos.id`
- `pedido_id`: `carregamentos.pedido_id` (ou join em `comercial.pedidos.numero` quando existir)
- `cliente`: `carregamentos.cliente`
- `motorista_nome`: `carregamentos.motorista`
- `placa_caminhao`: `carregamentos.placa`
- `data_carga`: `carregamentos.data`
- `data_entrega`: pendente por join (não está explícito em `carregamentos`)

## 3) carregamento_concluido

Fonte principal:
- `public.carregamentos` com `status = 'finalizado'`

Campos úteis:
- os mesmos de `carga_confirmada`

Payload alvo:
- `carga_id`: `carregamentos.id`
- `pedido_id`: `carregamentos.pedido_id`
- `cliente`: `carregamentos.cliente`
- `carregado_em`: `carregamentos.created_at` (ou campo de atualização de status, se existir via trigger/evento)

## Pendências para fechar 100%

1. Origem de `cidade_origem` para `pedido_novo`.
2. Regra oficial de `pedido_id` para mensagem (usar `numero` ou `id`).
3. Regra oficial de `data_entrega` para `carga_confirmada`.
4. IDs dos grupos WhatsApp (gestores e logística):
   - grupo logística (para `carga_confirmada`);
   - grupo gestores (para `pedido_novo` e `carregamento_concluido`).

## Queries de referência (read-only)

```sql
-- pedido_novo
select e.id, e.pedido_id, e.tipo_evento, e.created_at,
       p.numero, p.cliente_snapshot_nome, p.entrega_municipio, p.entrega_data
from comercial.pedido_eventos e
join comercial.pedidos p on p.id = e.pedido_id
where e.tipo_evento = 'PEDIDO_CRIADO'
order by e.created_at desc;

-- carga_confirmada
select id, pedido_id, cliente, motorista, placa, data, status, created_at
from public.carregamentos
where status = 'confirmado'
order by created_at desc;

-- carregamento_concluido
select id, pedido_id, cliente, motorista, placa, data, status, created_at
from public.carregamentos
where status = 'finalizado'
order by created_at desc;
```

## Recomendação prática para o MVP

Para entrar rápido em produção sem travar em modelagem atual do Lotus:
- manter o bot recebendo eventos via webhook do Lotus (fonte oficial);
- manter destinos de grupo no próprio bot (`alert_recipients`);
- depois, fase 2: expandir para destinos individuais quando necessário.
