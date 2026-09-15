import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

/** Public devnet endpoints (rotate when one rate-limits). */
export function devnetRpcCandidates(primary) {
  return [...new Set([primary, "https://api.devnet.solana.com"].filter(Boolean))];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getSolBalance(connection, pubkey) {
  return connection.getBalance(pubkey);
}

/**
 * Try devnet airdrop with retries + smaller amounts.
 * @returns {boolean} true if balance is sufficient
 */
export async function ensureDevnetSol(pubkey, options = {}) {
  const {
    minSol = 0.15,
    rpc = "https://api.devnet.solana.com",
    airdropAttempts = [0.5, 0.25],
  } = options;

  const minLamports = minSol * LAMPORTS_PER_SOL;
  const address = typeof pubkey === "string" ? new PublicKey(pubkey) : pubkey;

  let connection = new Connection(rpc, "confirmed");
  let balance = await connection.getBalance(address);

  if (balance >= minLamports) {
    console.log(`SOL balance OK: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    return connection;
  }

  console.log(
    `Low balance (${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL) — requesting devnet airdrop…`,
  );

  for (const endpoint of devnetRpcCandidates(rpc)) {
    connection = new Connection(endpoint, "confirmed");
    for (const solAmount of airdropAttempts) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`  → ${solAmount} SOL via ${endpoint} (try ${attempt}/3)`);
          const sig = await connection.requestAirdrop(
            address,
            solAmount * LAMPORTS_PER_SOL,
          );
          const latest = await connection.getLatestBlockhash();
          await connection.confirmTransaction(
            { signature: sig, ...latest },
            "confirmed",
          );
          balance = await connection.getBalance(address);
          if (balance >= minLamports) {
            console.log(`✓ Airdrop OK: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
            return connection;
          }
        } catch (err) {
          const msg = err?.message || String(err);
          console.warn(`  ✗ ${msg.slice(0, 80)}`);
          await sleep(2000 * attempt);
        }
      }
    }
  }

  balance = await connection.getBalance(address);
  if (balance >= minLamports) {
    return connection;
  }

  throw new Error(
    [
      "Devnet airdrop failed (faucet rate limit / internal error).",
      "",
      `Wallet: ${address.toBase58()}`,
      `Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL (need ~${minSol} SOL)`,
      "",
      "Manual options:",
      "  1. https://faucet.solana.com  → paste wallet → Devnet → Airdrop",
      "  2. https://faucet.quicknode.com/solana/devnet",
      "",
      "Then re-run this command.",
    ].join("\n"),
  );
}
