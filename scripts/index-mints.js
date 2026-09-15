/**
 * Mint indexer — writes Candy Machine Pass mints into Supabase `passes`
 * and keeps owner_wallet + stats_cache in sync.
 *
 * One shot:   npm run index-mints
 * Poll loop:  npm run index-mints:watch
 *
 * Requires (never VITE_ for secrets):
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SOLANA_RPC_URL or HELIUS_RPC_URL
 * Collection / CM read from Supabase project_config, overridable by
 * COLLECTION_MINT / CANDY_MACHINE / CANDY_GUARD in .env.local
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import {
  fetchAsset,
  fetchAssetsByCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";
import { loadEnvFiles, requireEnv, getRpcUrl } from "./load-env.js";

loadEnvFiles();

const CANDY_GUARD_PROGRAM = "CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ";
const MINT_V1_DISC = Buffer.from([145, 98, 192, 118, 184, 147, 118, 104]);
const WATCH = process.argv.includes("--watch") || process.env.INDEXER_WATCH === "1";
const POLL_MS = Number(process.env.INDEXER_POLL_MS ?? 20_000);

function isUsable(value) {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  return Boolean(v) && !v.includes("YOUR_") && !v.includes("PLACEHOLDER");
}

function parseSerial(name) {
  const match = String(name ?? "").match(/#(\d+)/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isInteger(n) || n < 1 || n > 2222) return null;
  return n;
}

function ixData(ix) {
  if (!ix?.data) return Buffer.alloc(0);
  if (typeof ix.data === "string") {
    try {
      return Buffer.from(bs58.decode(ix.data));
    } catch {
      try {
        return Buffer.from(ix.data, "base64");
      } catch {
        return Buffer.alloc(0);
      }
    }
  }
  return Buffer.from(ix.data);
}

function accountKeysOf(tx) {
  const msg = tx.transaction.message;
  if (typeof msg.getAccountKeys === "function") {
    const keys = msg.getAccountKeys({
      accountKeysFromLookups: tx.meta?.loadedAddresses,
    });
    const out = [];
    for (let i = 0; i < keys.length; i += 1) {
      out.push(keys.get(i).toBase58());
    }
    return out;
  }
  return (msg.accountKeys ?? []).map((k) =>
    typeof k === "string" ? k : k.pubkey?.toBase58?.() ?? k.toBase58(),
  );
}

function compiledInstructions(tx) {
  const msg = tx.transaction.message;
  const outer = msg.compiledInstructions ?? msg.instructions ?? [];
  const inner = (tx.meta?.innerInstructions ?? []).flatMap((g) => g.instructions ?? []);
  return [...outer, ...inner];
}

function parseCandyMint(tx) {
  const keys = accountKeysOf(tx);
  for (const ix of compiledInstructions(tx)) {
    const programId =
      keys[ix.programIdIndex] ??
      (typeof ix.programId === "string" ? ix.programId : ix.programId?.toBase58?.());
    if (programId !== CANDY_GUARD_PROGRAM) continue;
    const data = ixData(ix);
    if (data.length < 8 || !data.subarray(0, 8).equals(MINT_V1_DISC)) continue;
    const indexes = ix.accountKeyIndexes ?? ix.accounts ?? [];
    const asset = keys[indexes[7]];
    const owner = keys[indexes[6]] ?? keys[indexes[5]];
    if (!asset || !owner) continue;
    return { asset, owner };
  }
  return null;
}

async function rpcJson(url, method, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "oppos-indexer", method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || method);
  return json.result;
}

async function loadConfig(supabase) {
  const { data, error } = await supabase.from("project_config").select("*").eq("id", 1).single();
  if (error) throw error;
  const env = {
    collection_mint: process.env.COLLECTION_MINT,
    candy_machine: process.env.CANDY_MACHINE,
    candy_guard: process.env.CANDY_GUARD,
  };
  const merged = { ...data };
  for (const [key, value] of Object.entries(env)) {
    if (isUsable(value)) merged[key] = value.trim();
  }
  if (!isUsable(merged.collection_mint) || !isUsable(merged.candy_machine)) {
    throw new Error(
      "collection_mint / candy_machine missing. Sync Supabase or set COLLECTION_MINT and CANDY_MACHINE in .env.local",
    );
  }
  return merged;
}

async function listSignatures(connection, address, until) {
  const pubkey = new PublicKey(address);
  const out = [];
  let before;
  for (;;) {
    const page = await connection.getSignaturesForAddress(pubkey, {
      before,
      until: until || undefined,
      limit: 1000,
    });
    if (!page.length) break;
    out.push(...page);
    if (page.length < 1000) break;
    before = page[page.length - 1].signature;
  }
  return out;
}

async function fetchTx(connection, signature) {
  return connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
}

function nextFreeSerial(used, maxSupply) {
  for (let i = 1; i <= maxSupply; i += 1) {
    if (!used.has(i)) return i;
  }
  throw new Error(`No free serial left under max_supply=${maxSupply}`);
}

async function refreshStats(supabase, minted, maxSupply) {
  const { error } = await supabase
    .from("stats_cache")
    .update({
      minted_count: minted,
      remaining_supply: Math.max(0, maxSupply - minted),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw error;
}

async function runOnce() {
  const rpc = getRpcUrl();
  const supabase = createClient(
    requireEnv("VITE_SUPABASE_URL", "Supabase project URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", "service role for indexer writes"),
  );
  const config = await loadConfig(supabase);
  const maxSupply = Number(config.max_supply ?? 2222);
  const burnRaw = String(config.burn_amount_raw ?? 22_222_000_000);
  const solPaid = String(config.mint_surcharge_lamports ?? 200_000_000);
  const connection = new Connection(rpc, "confirmed");
  const umi = createUmi(rpc).use(mplCore());

  const { data: stateRow, error: stateErr } = await supabase
    .from("indexer_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (stateErr) throw stateErr;

  const { data: existingRows, error: existingErr } = await supabase
    .from("passes")
    .select("serial, asset_address, owner_wallet, mint_tx");
  if (existingErr) throw existingErr;

  const byAsset = new Map((existingRows ?? []).map((row) => [row.asset_address, row]));
  const usedSerials = new Set((existingRows ?? []).map((row) => row.serial));
  const usedTx = new Set((existingRows ?? []).map((row) => row.mint_tx));

  const until = stateRow?.last_signature || undefined;
  const sigs = await listSignatures(connection, config.candy_machine, until);
  // RPC returns newest-first; apply oldest-first so serials follow mint order.
  const chronological = [...sigs].reverse();

  let inserted = 0;
  let newestSig = until ?? null;
  let newestSlot = stateRow?.last_slot ?? null;

  for (const info of chronological) {
    if (usedTx.has(info.signature)) {
      newestSig = info.signature;
      newestSlot = info.slot ?? newestSlot;
      continue;
    }

    const tx = await fetchTx(connection, info.signature);
    if (!tx) {
      // RPC lag: do not advance the cursor past an unread mint.
      break;
    }

    newestSig = info.signature;
    newestSlot = info.slot ?? newestSlot;
    if (tx.meta?.err) continue;
    const parsed = parseCandyMint(tx);
    if (!parsed) continue;
    if (byAsset.has(parsed.asset)) continue;

    let name = "";
    let owner = parsed.owner;
    try {
      const asset = await fetchAsset(umi, publicKey(parsed.asset), { skipDerivePlugins: true });
      name = asset.name ?? "";
      owner = String(asset.owner ?? parsed.owner);
    } catch {
      // Asset fetch can lag right after mint; fall back to tx accounts.
    }

    let serial = parseSerial(name);
    if (!serial || usedSerials.has(serial)) {
      serial = nextFreeSerial(usedSerials, maxSupply);
    }

    const mintedAt = info.blockTime
      ? new Date(info.blockTime * 1000).toISOString()
      : new Date().toISOString();

    const row = {
      serial,
      asset_address: parsed.asset,
      owner_wallet: owner,
      mint_tx: info.signature,
      burn_amount_raw: burnRaw,
      sol_paid_lamports: solPaid,
      minted_at: mintedAt,
    };

    const { error: insertErr } = await supabase.from("passes").insert(row);
    if (insertErr) {
      if (insertErr.code === "23505") continue;
      throw insertErr;
    }

    byAsset.set(parsed.asset, row);
    usedSerials.add(serial);
    usedTx.add(info.signature);
    inserted += 1;
  }

  let ownersUpdated = 0;
  try {
    const onChain = await fetchAssetsByCollection(umi, publicKey(config.collection_mint), {
      skipDerivePlugins: true,
    });
    for (const asset of onChain) {
      const address = String(asset.publicKey);
      const owner = String(asset.owner);
      const existing = byAsset.get(address);
      if (!existing) continue;
      if (existing.owner_wallet !== owner) {
        const { error } = await supabase
          .from("passes")
          .update({ owner_wallet: owner, indexed_at: new Date().toISOString() })
          .eq("asset_address", address);
        if (error) throw error;
        existing.owner_wallet = owner;
        ownersUpdated += 1;
      }
    }
  } catch (err) {
    console.warn("Collection owner sync skipped:", err.message || err);
  }

  const { count, error: countErr } = await supabase
    .from("passes")
    .select("*", { count: "exact", head: true });
  if (countErr) throw countErr;
  await refreshStats(supabase, count ?? byAsset.size, maxSupply);

  if (newestSig) {
    const slot =
      newestSlot ??
      (await rpcJson(rpc, "getSlot", [{ commitment: "confirmed" }]).catch(() => null));
    const { error } = await supabase
      .from("indexer_state")
      .upsert({
        id: 1,
        last_signature: newestSig,
        last_slot: slot,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
  }

  return {
    rpc: rpc.includes("devnet") ? "devnet" : "mainnet-or-custom",
    scanned: chronological.length,
    inserted,
    ownersUpdated,
    minted: count ?? byAsset.size,
    remaining: Math.max(0, maxSupply - (count ?? byAsset.size)),
  };
}

async function main() {
  const once = await runOnce();
  console.log(JSON.stringify(once, null, 2));
  if (!WATCH) return;

  console.log(`Watching every ${POLL_MS}ms — Ctrl+C to stop`);
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    try {
      const result = await runOnce();
      console.log(JSON.stringify({ ...result, at: new Date().toISOString() }));
    } catch (err) {
      console.error("indexer tick failed:", err.message || err);
    }
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
