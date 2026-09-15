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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * On-chain mint lands before the indexer row. Poll until DB count catches up
 * (or attempts run out — UI should already show an optimistic +1).
 */
export async function waitForIndexedSupply(minCount, { attempts = 8, delayMs = 2500 } = {}) {
  let last = await fetchMintedSupply();
  if (last >= minCount) return last;
  for (let i = 0; i < attempts; i += 1) {
    await sleep(delayMs);
    last = await fetchMintedSupply();
    if (last >= minCount) return last;
  }
  return last;
}
