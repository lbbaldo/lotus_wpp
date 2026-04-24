do $$ begin
  create type alert_type as enum ('pedido_novo', 'carga_confirmada', 'carregamento_concluido');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type queue_status as enum ('pending', 'processing', 'sent', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type event_status as enum ('accepted', 'ignored_duplicate', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type recipient_target_type as enum ('group', 'contact');
exception
  when duplicate_object then null;
end $$;

create table if not exists alert_recipients (
  id bigserial primary key,
  alert_type alert_type not null,
  recipient_name text not null,
  target_type recipient_target_type not null default 'group',
  target_id text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists incoming_events (
  id bigserial primary key,
  event_id uuid not null,
  event_type alert_type not null,
  idempotency_key text not null unique,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  status event_status not null,
  reject_reason text
);

create table if not exists message_queue (
  id bigserial primary key,
  incoming_event_id bigint not null references incoming_events(id),
  recipient_target_type recipient_target_type not null,
  recipient_target_id text not null,
  message_text text not null,
  status queue_status not null default 'pending',
  attempts int not null default 0,
  max_attempts int not null default 5,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  evolution_message_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists delivery_logs (
  id bigserial primary key,
  message_queue_id bigint not null references message_queue(id),
  provider text not null default 'evolution_api_v2',
  request_payload jsonb not null,
  response_status int,
  response_body jsonb,
  outcome queue_status not null,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_queue_dispatch on message_queue (status, next_attempt_at);
create index if not exists idx_events_type_time on incoming_events (event_type, received_at desc);
