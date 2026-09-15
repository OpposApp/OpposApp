-- Mint economics: 22,000 $OPPOS burn + 0.2 SOL surcharge

alter table project_config
  alter column burn_amount_raw set default 22000000000,
  alter column mint_surcharge_lamports set default 200000000;

update project_config
set
  burn_amount_raw = 22000000000,
  mint_surcharge_lamports = 200000000,
  updated_at = now()
where id = 1;
