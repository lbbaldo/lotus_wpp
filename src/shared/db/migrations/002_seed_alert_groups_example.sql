-- Expected group id format in most setups: 1203630XXXXXXXXX@g.us

insert into alert_recipients (alert_type, recipient_name, target_type, target_id, active)
select 'carga_confirmada', 'Grupo Logistica', 'group', '1203630LOGISTICA@g.us', true
where not exists (
  select 1
  from alert_recipients
  where alert_type = 'carga_confirmada'
);

insert into alert_recipients (alert_type, recipient_name, target_type, target_id, active)
select 'carregamento_concluido', 'Grupo Gestores', 'group', '1203630GESTORES@g.us', true
where not exists (
  select 1
  from alert_recipients
  where alert_type = 'carregamento_concluido'
);

update alert_recipients
set active = false
where alert_type = 'pedido_novo'
  and target_id <> '120363426140582915@g.us';

insert into alert_recipients (alert_type, recipient_name, target_type, target_id, active)
select 'pedido_novo', 'GRUPO PARA PEDIDOS LOTUS', 'group', '120363426140582915@g.us', true
where not exists (
  select 1
  from alert_recipients
  where alert_type = 'pedido_novo'
    and target_id = '120363426140582915@g.us'
);

update alert_recipients
set recipient_name = 'GRUPO PARA PEDIDOS LOTUS',
    target_type = 'group',
    active = true
where alert_type = 'pedido_novo'
  and target_id = '120363426140582915@g.us';
