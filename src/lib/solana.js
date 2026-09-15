import { isDevnetRpc, SOLANA_RPC_CANDIDATES } from "./env.js";

const LAMPORTS_PER_SOL = 1_000_000_000n;
const SOLSCAN_CLUSTER = isDevnetRpc ? "?cluster=devnet" : "";

export function lamportsToSol(lamports) {
  const n = BigInt(lamports ?? 0);
  const whole = n / LAMPORTS_PER_SOL;
  const frac = n % LAMPORTS_PER_SOL;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(9, "0").replace(/0+$/, "")}`;
}

export function solscanTx(sig) {
  return `https://solscan.io/tx/${sig}${SOLSCAN_CLUSTER}`;
}

export function solscanAccount(pubkey) {
  return `https://solscan.io/account/${pubkey}${SOLSCAN_CLUSTER}`;
}

export function solscanToken(mint) {
  return `https://solscan.io/token/${mint}${SOLSCAN_CLUSTER}`;
}

export async function fetchSolBalanceLamports(pubkey) {
  if (!pubkey) return 0;
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getBalance",
    params: [pubkey, { commitment: "confirmed" }],
  });

  let lastError = new Error("RPC unavailable");
  for (const endpoint of SOLANA_RPC_CANDIDATES) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        lastError = new Error(`RPC ${res.status}`);
        continue;
      }
      const json = await res.json();
      if (json.error) {
        lastError = new Error(json.error.message || "getBalance failed");
        continue;
      }
      return json.result?.value ?? 0;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("RPC request failed");
    }
  }
  throw lastError;
}

export function formatBurnAmount(raw, decimals = 6) {
  if (raw == null || raw === "") return "—";
  try {
    return (BigInt(raw) / BigInt(10 ** decimals)).toLocaleString();
  } catch {
    return "—";
  }
}

function isPlaceholder(value) {
  if (!value) return true;
  const s = String(value);
  return s.includes("PLACEHOLDER") || s.includes("YOUR_");
}

/** Validates mint prerequisites — returns null if ready, or an error message. */
export function getMintReadiness(config) {
  if (!config) return "Loading project configuration…";
  if (isPlaceholder(config.token_mint)) {
    return "Token mint not configured — launch $OPPOS on pump.fun and update Supabase project_config.";
  }
  if (isPlaceholder(config.collection_mint)) {
    return "Collection not configured — create Metaplex Core collection and update project_config.";
  }
  if (isPlaceholder(config.candy_machine)) {
    return "Candy Machine not configured — run npm run setup-candy-machine and update project_config.";
  }
  if (isPlaceholder(config.candy_guard)) {
    return "Candy Guard not configured — mint would skip burn/SOL guards. Update project_config.";
  }
  if (isPlaceholder(config.treasury_wallet)) {
    return "Treasury wallet not configured — update project_config before minting.";
  }
  return null;
}

/**
 * Mint Pass via Core Candy Machine + Candy Guard (burn + SOL guards).
 * Call getMintReadiness() first for UI gating.
 * @returns {Promise<string>} transaction signature
 */
export async function mintPass({ wallet, config }) {
  if (!wallet?.publicKey) {
    throw new Error("Wallet not connected");
  }

  const readiness = getMintReadiness(config);
  if (readiness) {
    throw new Error(readiness);
  }

  const { mintPassFromCandyMachine } = await import("./mint.js");
  return mintPassFromCandyMachine({ wallet, config });
}
