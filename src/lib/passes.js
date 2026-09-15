import { fetchPassCount, fetchPassesByWallet } from "./supabase.js";

/** Wallet passes from the mint indexer (Supabase). */
export async function fetchWalletPasses(wallet) {
  if (!wallet) return [];
  return fetchPassesByWallet(wallet).catch(() => []);
}

/** Total minted from the indexer. Candy Machine sold-out is still enforced on-chain at mint time. */
export async function fetchMintedSupply() {
  return fetchPassCount().catch(() => 0);
}
