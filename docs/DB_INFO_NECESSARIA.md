# Lotus DB Information Needed (Read-only)

I only need **read-only access** to map event payloads and avoid assumptions.
No schema/table/function edits are needed.

## 1) Connection

Provide one read-only DSN:

```txt
postgres://lotus_readonly:***@HOST:5432/DB_NAME
```

Required permissions:
- CONNECT on database
- USAGE on schemas used by Lotus
- SELECT on the involved tables/views

## 2) Business mapping required

Please confirm where each event should come from:
- `pedido_novo`
- `carga_confirmada`
- `carregamento_concluido`

For each event, I need:
- source table/view
- primary key / unique id
- event timestamp field
- tenant/company field (if multi-tenant)
- status field and exact trigger value

## 3) Minimal field map required

### pedido_novo
- `pedido_id`
- `cliente`
- `cidade_origem`
- `cidade_destino`
- `data_prevista_entrega`

### carga_confirmada
- `carga_id`
- `pedido_id`
- `cliente`
- `motorista_nome`
- `placa_caminhao`
- `data_carga`
- `data_entrega`

### carregamento_concluido
- `carga_id`
- `pedido_id`
- `cliente`
- `carregado_em`

## 4) Groups destination (WhatsApp)

As discussed, the MVP will send to WhatsApp groups.
I need only:
- logistics group id (example: `1203630...@g.us`)
- managers group id (example: `1203630...@g.us`)

Routing:
- `carga_confirmada` -> logistics group
- `pedido_novo` and `carregamento_concluido` -> managers group

## 5) Validation queries (read-only)

You can run these and send outputs to speed up integration:

```sql
-- schemas
select schema_name
from information_schema.schemata
order by 1;

-- candidate tables
select table_schema, table_name
from information_schema.tables
where table_type = 'BASE TABLE'
  and table_schema not in ('pg_catalog', 'information_schema')
order by table_schema, table_name;

-- columns for likely business tables (adjust names if needed)
select table_schema, table_name, column_name, data_type
from information_schema.columns
where table_schema not in ('pg_catalog', 'information_schema')
  and (
    table_name ilike '%pedido%'
    or table_name ilike '%carga%'
    or table_name ilike '%carreg%'
    or table_name ilike '%motorista%'
    or table_name ilike '%cliente%'
  )
order by table_schema, table_name, ordinal_position;
```

## 6) Group id format

Please confirm which exact identifier Evolution expects for group messages in your instance.
Most setups use JID like: `1203630xxxxxxxxx@g.us`.
