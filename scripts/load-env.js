import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

/** Load `.env.local` / `.env` for Node scripts (Vite does this automatically in the browser). */
export function loadEnvFiles() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

export function requireEnv(name, hint) {
  const value = process.env[name]?.trim();
  if (!value || value.includes("YOUR_")) {
    throw new Error(`${name} is missing or still a placeholder in .env.local — ${hint}`);
  }
  return value;
}

export function getRpcUrl() {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.HELIUS_RPC_URL ||
    "https://api.devnet.solana.com"
  );
}
