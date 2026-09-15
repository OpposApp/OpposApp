/** Runtime env helpers — Vite inlines these at build time. */
export const isPrivyConfigured = Boolean(import.meta.env.VITE_PRIVY_APP_ID);
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/**
 * Browser RPC. Paid keys must never use a VITE_ prefix (they ship in the JS bundle).
 * Official `api.mainnet-beta.solana.com` returns 403 for browser Origin requests.
 */
const PUBLIC_MAINNET_RPC = "https://solana-rpc.publicnode.com";

export const SOLANA_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL || PUBLIC_MAINNET_RPC;

export const isDevnetRpc = SOLANA_RPC.includes("devnet");

export const SOLANA_RPC_CANDIDATES = [
  ...new Set(
    [
      SOLANA_RPC,
      isDevnetRpc ? "https://api.devnet.solana.com" : PUBLIC_MAINNET_RPC,
      isDevnetRpc ? null : "https://solana.publicnode.com",
    ].filter(Boolean),
  ),
];
