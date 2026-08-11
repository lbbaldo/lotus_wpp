# Lotus WhatsApp Bot (MVP)

Microservico em TypeScript para receber eventos do Lotus e enviar alertas via Evolution API v2.

## Stack

- Node.js + Fastify
- PostgreSQL
- Redis + BullMQ
- Docker Compose

## Endpoints

- `GET /health`
- `GET /v1/health` (requires `X-Lotus-Key`)
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

## Health check para o Lotus

O Lotus pode consultar o status operacional do bot em:

```text
GET /v1/health
X-Lotus-Key: <LOTUS_WEBHOOK_API_KEY>
```

Exemplo de resposta online:

```json
{
  "ok": true,
  "service": "whatsapp-bot",
  "status": "online",
  "db": "ok",
  "redis": "ok",
  "evolution_api": "ok",
  "whatsapp_connected": true,
  "whatsapp_state": "open",
  "timestamp": "2026-04-25T16:30:00.000Z"
}
```

## Contrato de eventos Lotus

Eventos aceitos em `event_type`:

- `pedido_novo`
- `carga_confirmada`
- `carregamento_concluido`

O texto enviado ao WhatsApp vem no campo `message`.

O contexto empresarial é obrigatório e validado pelo par `source`/`tenant_id`:

- `lotus` / `11111111-1111-4111-8111-111111111111`
- `sodex` / `22222222-2222-4222-8222-222222222222`

`organization_id` é metadado interno da plataforma Lotus e não faz parte do webhook.
Os destinatários em `alert_recipients` são isolados por `tenant_id`.

### carga_confirmada

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
