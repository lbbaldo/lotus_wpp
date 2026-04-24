do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'incoming_events'
      and column_name = 'event_id'
      and udt_name = 'uuid'
  ) then
    alter table incoming_events
      alter column event_id type text using event_id::text;
  end if;
end $$;
