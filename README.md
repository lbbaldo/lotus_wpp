# Lotus WhatsApp Bot (MVP)

Microservico em TypeScript para receber eventos do Lotus e enviar alertas via Evolution API v2.

## Stack

- Node.js + Fastify
- PostgreSQL
- Redis + BullMQ
- Docker Compose

## Endpoints

- `GET /health`
- `POST /v1/webhooks/lotus/events`
- `POST /v1/webhooks/evolution` (stub MVP)
- `POST /v1/admin/reprocess/:messageQueueId` (requires `X-Admin-Key`, optional)

## Destino de mensagens

- O MVP envia para grupos de WhatsApp.
- Os destinos ficam em `alert_recipients` com `target_type='group'` e `target_id` (ex: `1203630...@g.us`).

## Estrutura

- `src/modules/webhooks`: entrada de eventos
- `src/modules/routing`: roteamento de destinatarios
- `src/modules/messaging`: templates e envio
- `src/modules/queue`: fila e worker
- `src/shared/db`: conexao e migrations

## ENV files

- `.env.example`: referencia base
- `.env.homolog.example`: referencia para homolog/producao

Para rodar localmente, copie e ajuste:

```bash
cp .env.example .env
```

## Execucao local

1. Instale dependencias:

```bash
npm install
```

2. Rode migration:

```bash
npm run db:migrate
```

3. Ajuste os grupos no seed de exemplo e rode novamente:

- `src/shared/db/migrations/002_seed_alert_groups_example.sql`

4. Inicie API:

```bash
npm run dev
```

5. Em outro terminal, inicie worker:

```bash
npm run build
npm run start:worker
```

## Docker

```bash
docker compose up -d --build
```

## Integracao com Lotus DB (read-only)

Arquivo com checklist do que eu preciso do banco Lotus:

- `docs/DB_INFO_NECESSARIA.md`

Acesso necessario: somente leitura (SELECT).

## Contrato de carga_confirmada (atual)

Campos esperados em `data`:

- `carga_id`
- `pedido_id` (pode ser `null`)
- `cliente`
- `motorista_nome`
- `placa_caminhao`
- `data_carga`
- `produto`
- `peso_kg`
- `quantidade`
- `strech` (boolean)
