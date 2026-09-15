-- Core Candy Machine addresses for on-site minting

alter table project_config
  add column if not exists candy_machine text,
  add column if not exists candy_guard text;
