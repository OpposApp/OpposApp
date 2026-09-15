/**
 * Push devnet addresses from .env.local → Supabase project_config.
 * Run: npm run sync-devnet-config
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvFiles, requireEnv } from "./load-env.js";

loadEnvFiles();

const updates = {
  token_mint: process.env.TOKEN_MINT,
  collection_mint: process.env.COLLECTION_MINT,
  candy_machine: process.env.CANDY_MACHINE,
  candy_guard: process.env.CANDY_GUARD,
  treasury_wallet: process.env.TREASURY_WALLET,
};

async function main() {
  requireEnv("VITE_SUPABASE_URL", "set Supabase URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", "service role key for writes");

  const missing = Object.entries(updates).filter(([, v]) => !v || String(v).includes("YOUR_"));
  if (missing.length) {
    throw new Error(
      `Missing in .env.local: ${missing.map(([k]) => k).join(", ")}\nRun setup-candy-machine first and add CANDY_MACHINE / CANDY_GUARD.`,
    );
  }

  const client = createClient(
    process.env.VITE_SUPABASE_URL.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY.trim(),
  );

  const treasury = updates.treasury_wallet?.trim();
  const payload = {
    ...updates,
    burn_amount_raw: process.env.BURN_AMOUNT_RAW ?? 22222000000,
    mint_surcharge_lamports: process.env.MINT_SURCHARGE_LAMPORTS ?? 200_000_000,
    // 20% / 30% stay in treasury until those splits are enabled
    dev_wallet: process.env.DEV_WALLET?.trim() || process.env.VITE_DEV_WALLET?.trim() || treasury,
    ops_wallet: process.env.OPS_WALLET?.trim() || process.env.VITE_OPS_WALLET?.trim() || treasury,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("project_config")
    .update(payload)
    .eq("id", 1)
    .select()
    .single();

  if (error) throw error;

  console.log("✅ Supabase project_config updated\n");
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
