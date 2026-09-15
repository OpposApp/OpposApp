/** Runtime env helpers — Vite inlines these at build time. */
export const isPrivyConfigured = Boolean(import.meta.env.VITE_PRIVY_APP_ID);
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/** Browser RPC. Paid keys must never use a VITE_ prefix (they ship in the JS bundle). */
export const SOLANA_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export const isDevnetRpc = SOLANA_RPC.includes("devnet");
