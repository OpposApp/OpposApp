import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./env.js";
import { mergeMintEconomics } from "./mintConfig.js";
import { mergeDevnetOverrides } from "./devnetConfig.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!isSupabaseConfigured) {
  console.warn("[Oppos] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

function assertSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local",
    );
  }
  return supabase;
}

export async function fetchProjectConfig() {
  const client = assertSupabase();
  const { data, error } = await client.from("project_config").select("*").single();
  if (error) throw error;
  return mergeDevnetOverrides(mergeMintEconomics(data));
}

export async function fetchStatsCache() {
  const client = assertSupabase();
  const { data, error } = await client.from("stats_cache").select("*").single();
  if (error) throw error;
  return data;
}

export async function fetchPassCount() {
  const client = assertSupabase();
  const { count, error } = await client
    .from("passes")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function fetchDistributions(limit = 24) {
  const client = assertSupabase();
  const { data, error } = await client
    .from("distributions")
    .select(
      `
      id, period_start, period_end,
      fees_in_lamports, holder_lamports, dev_lamports, ops_lamports,
      tx_sweep, tx_holder, tx_dev, tx_ops,
      status, completed_at,
      snapshots ( week_label )
    `,
    )
    .order("period_end", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchPassesByWallet(wallet) {
  const client = assertSupabase();
  const { data, error } = await client
    .from("passes")
    .select("serial, asset_address, mint_tx, minted_at")
    .eq("owner_wallet", wallet)
    .order("serial", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
