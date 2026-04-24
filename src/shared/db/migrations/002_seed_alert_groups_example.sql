-- Replace target_id values with your real WhatsApp group ids from Evolution/WhatsApp.
-- Expected format in most setups: 1203630XXXXXXXXX@g.us

insert into alert_recipients (alert_type, recipient_name, target_type, target_id, active)
values
  ('carga_confirmada', 'Grupo Logistica', 'group', '1203630LOGISTICA@g.us', true),
  ('pedido_novo', 'Grupo Gestores', 'group', '1203630GESTORES@g.us', true),
  ('carregamento_concluido', 'Grupo Gestores', 'group', '1203630GESTORES@g.us', true)
on conflict do nothing;
