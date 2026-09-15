/**
 * Local devnet overrides (VITE_* in .env.local) for mint testing on localhost
 * without waiting on Supabase manual edits.
 */
const DEVNET_FIELDS = [
  "token_mint",
  "collection_mint",
  "candy_machine",
  "candy_guard",
  "treasury_wallet",
  "dev_wallet",
  "ops_wallet",
];

function isUsableEnv(value) {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  if (!v || v.includes("YOUR_") || v.includes("PLACEHOLDER")) return false;
  return true;
}

export function mergeDevnetOverrides(config) {
  if (!config) return config;
  if (!import.meta.env.DEV) return config;
  const next = { ...config };
  for (const field of DEVNET_FIELDS) {
    const envKey = `VITE_${field.toUpperCase()}`;
    const fromEnv = import.meta.env[envKey];
    if (isUsableEnv(fromEnv)) {
      next[field] = fromEnv.trim();
    }
  }
  return next;
}
