-- Mint economics: 22,222 $OPPOS burn (was 22,000)
alter table project_config
  alter column burn_amount_raw set default 22222000000;

update project_config
set
  burn_amount_raw = 22222000000,
  updated_at = now()
where id = 1;
