/**
 * Wipe indexed Pass rows and rewind the mint cursor past current Candy Machine
 * history so test mints no longer count. Devnet only.
 *
 * Does not un-mint on-chain NFTs (impossible). Those 3 test Passes stay in the
 * wallet as collectibles; the product counter goes back to 0/2222.
 *
 * Run: npm run reset-pass-index
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFiles, requireEnv, getRpcUrl } from "./load-env.js";

loadEnvFiles();

async function main() {
  const rpc = getRpcUrl();
  if (!rpc.includes("devnet")) {
    throw new Error("Refusing to wipe passes on non-devnet RPC");
  }

  const candyMachine = process.env.CANDY_MACHINE?.trim();
  if (!candyMachine) throw new Error("CANDY_MACHINE missing in .env.local");

  const supabase = createClient(
    requireEnv("VITE_SUPABASE_URL", "Supabase project URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", "service role for indexer writes"),
  );

  const { error: delErr } = await supabase.from("passes").delete().gt("serial", 0);
  if (delErr) throw delErr;

  const connection = new Connection(rpc, "confirmed");
  const latest = await connection.getSignaturesForAddress(new PublicKey(candyMachine), {
    limit: 1,
  });
  const cursor = latest[0] ?? null;

  const { error: stateErr } = await supabase.from("indexer_state").upsert({
    id: 1,
    last_signature: cursor?.signature ?? null,
    last_slot: cursor?.slot ?? null,
    updated_at: new Date().toISOString(),
  });
  if (stateErr) throw stateErr;

  const { error: statsErr } = await supabase
    .from("stats_cache")
    .update({
      minted_count: 0,
      remaining_supply: 2222,
      trailing_holder_lamports_7d: 0,
      trailing_fees_lamports_7d: 0,
      last_distribution_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (statsErr) throw statsErr;

  const { count, error: countErr } = await supabase
    .from("passes")
    .select("*", { count: "exact", head: true });
  if (countErr) throw countErr;

  console.log(
    JSON.stringify(
      {
        wiped: true,
        minted: count ?? 0,
        remaining: 2222,
        cursorSet: Boolean(cursor),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
