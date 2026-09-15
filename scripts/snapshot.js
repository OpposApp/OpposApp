/**
 * Weekly Pass holder snapshot via Helius DAS.
 * Run: npm run snapshot
 * Requires: HELIUS_RPC_URL, COLLECTION_MINT, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL
 */
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFiles, requireEnv } from "./load-env.js";

loadEnvFiles();

const RPC = requireEnv("HELIUS_RPC_URL", "paid RPC for DAS snapshots — never VITE_");
const COLLECTION = requireEnv("COLLECTION_MINT", "Metaplex Core collection mint");
const supabase = createClient(
  requireEnv("VITE_SUPABASE_URL", "Supabase project URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", "service role for snapshot writes"),
);

async function helius(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "oppos", method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

async function fetchOwners() {
  const counts = new Map();
  let page = 1;
  while (true) {
    const result = await helius("getAssetsByGroup", {
      groupKey: "collection",
      groupValue: COLLECTION,
      page,
      limit: 1000,
    });
    const items = result?.items ?? [];
    if (!items.length) break;
    for (const item of items) {
      const w = item.ownership?.owner;
      if (w) counts.set(w, (counts.get(w) ?? 0) + 1);
    }
    if (items.length < 1000) break;
    page += 1;
  }
  return counts;
}

function weekLabel(d = new Date()) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function main() {
  const counts = await fetchOwners();
  const holdings = [...counts.entries()].map(([wallet, passCount]) => ({
    wallet,
    passCount,
  }));
  const totalPasses = holdings.reduce((s, h) => s + h.passCount, 0);
  const slot = await helius("getSlot", [{ commitment: "finalized" }]);
  const csv = ["wallet,pass_count", ...holdings.map((h) => `${h.wallet},${h.passCount}`)].join(
    "\n",
  );
  const csvHash = createHash("sha256").update(csv).digest("hex");
  const label = weekLabel();

  const { data: snap, error } = await supabase
    .from("snapshots")
    .insert({
      week_label: label,
      slot,
      block_time: new Date().toISOString(),
      total_passes: totalPasses,
      unique_holders: holdings.length,
      csv_hash: csvHash,
      status: "completed",
    })
    .select("id")
    .single();

  if (error) throw error;

  await supabase.from("snapshot_holdings").insert(
    holdings.map((h) => ({
      snapshot_id: snap.id,
      wallet: h.wallet,
      pass_count: h.passCount,
    })),
  );

  console.log(JSON.stringify({ snapshotId: snap.id, weekLabel: label, totalPasses, csvHash }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
