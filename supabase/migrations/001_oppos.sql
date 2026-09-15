-- Oppos (oppos.app) — Supabase schema
-- $OPPOS on pump.fun · Pass NFT · rewards in SOL

create table project_config (
  id                    smallint primary key default 1 check (id = 1),
  token_mint            text not null,
  collection_mint       text,
  treasury_wallet       text not null,
  dev_wallet            text not null,
  ops_wallet            text not null,
  max_supply            int not null default 2222,
  burn_amount_raw       bigint not null default 100000000000,
  mint_surcharge_lamports bigint not null default 100000000,
  holder_bps            int not null default 5000,
  dev_bps               int not null default 2000,
  ops_bps               int not null default 3000,
  token_decimals        smallint not null default 6,
  snapshot_day_utc      smallint not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint split_bps check (holder_bps + dev_bps + ops_bps = 10000)
);

create table passes (
  id              bigserial primary key,
  serial          int not null unique check (serial >= 1 and serial <= 2222),
  asset_address   text not null unique,
  owner_wallet    text not null,
  mint_tx         text not null unique,
  burn_amount_raw bigint not null,
  sol_paid_lamports bigint not null,
  minted_at       timestamptz not null,
  indexed_at      timestamptz not null default now()
);

create index passes_owner_idx on passes (owner_wallet);
create index passes_minted_at_idx on passes (minted_at desc);

create table indexer_state (
  id              smallint primary key default 1 check (id = 1),
  last_signature  text,
  last_slot       bigint,
  updated_at      timestamptz not null default now()
);

create type snapshot_status as enum ('pending', 'completed', 'failed');

create table snapshots (
  id              bigserial primary key,
  week_label      text not null,
  slot            bigint not null,
  block_time      timestamptz not null,
  total_passes    int not null,
  unique_holders  int not null,
  csv_hash        text,
  status          snapshot_status not null default 'pending',
  created_at      timestamptz not null default now(),
  unique (week_label)
);

create table snapshot_holdings (
  snapshot_id     bigint not null references snapshots (id) on delete cascade,
  wallet          text not null,
  pass_count      int not null check (pass_count > 0),
  primary key (snapshot_id, wallet)
);

create index snapshot_holdings_wallet_idx on snapshot_holdings (wallet);

create type distribution_status as enum ('draft', 'split_pending', 'completed', 'failed');

create table distributions (
  id                    bigserial primary key,
  snapshot_id           bigint references snapshots (id),
  period_start          timestamptz not null,
  period_end            timestamptz not null,
  fees_in_lamports      bigint not null default 0,
  holder_lamports       bigint not null default 0,
  dev_lamports          bigint not null default 0,
  ops_lamports          bigint not null default 0,
  tx_sweep              text,
  tx_holder             text,
  tx_dev                text,
  tx_ops                text,
  status                distribution_status not null default 'draft',
  notes                 text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

create index distributions_period_idx on distributions (period_end desc);

create table distribution_payouts (
  id                bigserial primary key,
  distribution_id   bigint not null references distributions (id) on delete cascade,
  wallet            text not null,
  pass_count        int not null,
  amount_lamports   bigint not null,
  tx_signature      text,
  status            text not null default 'pending',
  unique (distribution_id, wallet)
);

create table stats_cache (
  id                    smallint primary key default 1 check (id = 1),
  minted_count          int not null default 0,
  remaining_supply      int not null default 2222,
  trailing_holder_lamports_7d bigint not null default 0,
  trailing_fees_lamports_7d   bigint not null default 0,
  last_distribution_at  timestamptz,
  updated_at            timestamptz not null default now()
);

alter table project_config enable row level security;
alter table passes enable row level security;
alter table snapshots enable row level security;
alter table snapshot_holdings enable row level security;
alter table distributions enable row level security;
alter table distribution_payouts enable row level security;
alter table stats_cache enable row level security;

create policy "public read config" on project_config for select using (true);
create policy "public read passes" on passes for select using (true);
create policy "public read snapshots" on snapshots for select using (true);
create policy "public read holdings" on snapshot_holdings for select using (true);
create policy "public read distributions" on distributions for select using (true);
create policy "public read payouts" on distribution_payouts for select using (true);
create policy "public read stats" on stats_cache for select using (true);

insert into project_config (
  token_mint, treasury_wallet, dev_wallet, ops_wallet
) values (
  'OPPOS_MINT_PLACEHOLDER',
  'TREASURY_PLACEHOLDER',
  'DEV_PLACEHOLDER',
  'OPS_PLACEHOLDER'
);

insert into stats_cache (minted_count, remaining_supply) values (0, 2222);
insert into indexer_state default values;
