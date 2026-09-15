-- Harden indexer_state: service role only, no public reads.
-- Numbered 005 so it does not collide with 002_mint_economics.sql.
alter table indexer_state enable row level security;
