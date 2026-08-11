begin;

alter table alert_recipients
  add column if not exists tenant_id text;

update alert_recipients
set tenant_id = '11111111-1111-4111-8111-111111111111'
where tenant_id is null;

alter table alert_recipients
  alter column tenant_id set not null;

create index if not exists idx_alert_recipients_tenant_event
  on alert_recipients (tenant_id, alert_type)
  where active = true;

alter table incoming_events
  add column if not exists tenant_id text;

update incoming_events
set tenant_id = case
  when lower(coalesce(payload ->> 'source', '')) = 'sodex'
    then '22222222-2222-4222-8222-222222222222'
  else '11111111-1111-4111-8111-111111111111'
end
where tenant_id is null;

alter table incoming_events
  alter column tenant_id set not null;

alter table incoming_events
  drop constraint if exists incoming_events_idempotency_key_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'incoming_events'::regclass
      and conname = 'incoming_events_tenant_idempotency_key'
  ) then
    alter table incoming_events
      add constraint incoming_events_tenant_idempotency_key
      unique (tenant_id, idempotency_key);
  end if;
end $$;

commit;
