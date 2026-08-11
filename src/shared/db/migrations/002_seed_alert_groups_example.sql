-- Expected group id format in most setups: 1203630XXXXXXXXX@g.us

alter table alert_recipients
  add column if not exists tenant_id text;

update alert_recipients
set tenant_id = '11111111-1111-4111-8111-111111111111'
where tenant_id is null;

alter table alert_recipients
  alter column tenant_id set not null;

insert into alert_recipients (tenant_id, alert_type, recipient_name, target_type, target_id, active)
select '11111111-1111-4111-8111-111111111111', 'carga_confirmada', 'Grupo Logistica', 'group', '1203630LOGISTICA@g.us', true
where not exists (
  select 1
  from alert_recipients
  where tenant_id = '11111111-1111-4111-8111-111111111111'
    and alert_type = 'carga_confirmada'
);

insert into alert_recipients (tenant_id, alert_type, recipient_name, target_type, target_id, active)
select '11111111-1111-4111-8111-111111111111', 'carregamento_concluido', 'Grupo Gestores', 'group', '1203630GESTORES@g.us', true
where not exists (
  select 1
  from alert_recipients
  where tenant_id = '11111111-1111-4111-8111-111111111111'
    and alert_type = 'carregamento_concluido'
);

update alert_recipients
set active = false
where tenant_id = '11111111-1111-4111-8111-111111111111'
  and alert_type = 'pedido_novo'
  and target_id <> '120363426140582915@g.us';

insert into alert_recipients (tenant_id, alert_type, recipient_name, target_type, target_id, active)
select '11111111-1111-4111-8111-111111111111', 'pedido_novo', 'GRUPO PARA PEDIDOS LOTUS', 'group', '120363426140582915@g.us', true
where not exists (
  select 1
  from alert_recipients
  where tenant_id = '11111111-1111-4111-8111-111111111111'
    and alert_type = 'pedido_novo'
    and target_id = '120363426140582915@g.us'
);

update alert_recipients
set recipient_name = 'GRUPO PARA PEDIDOS LOTUS',
    target_type = 'group',
    active = true
where tenant_id = '11111111-1111-4111-8111-111111111111'
  and alert_type = 'pedido_novo'
  and target_id = '120363426140582915@g.us';
