import { brandConfig } from "../config/brandConfig";
import { formatBurnAmount, lamportsToSol } from "./solana";

const mint = brandConfig.mint ?? {};

export const DEFAULT_BURN_AMOUNT_RAW = String(mint.burnAmountRaw ?? 22_222_000_000n);
export const DEFAULT_MINT_SURCHARGE_LAMPORTS = String(mint.mintSurchargeLamports ?? 200_000_000n);
export const DEFAULT_TOKEN_DECIMALS = mint.tokenDecimals ?? 6;
export const DEFAULT_BURN_DISPLAY = (mint.burnAmountTokens ?? 22_222).toLocaleString();
export const DEFAULT_MINT_SOL_DISPLAY = `${mint.mintSol ?? 0.2} SOL`;

/** Override stale Supabase mint economics with brandConfig (source of truth). */
export function mergeMintEconomics(config) {
  if (!config) return config;
  return {
    ...config,
    burn_amount_raw: DEFAULT_BURN_AMOUNT_RAW,
    mint_surcharge_lamports: DEFAULT_MINT_SURCHARGE_LAMPORTS,
    token_decimals: config.token_decimals ?? DEFAULT_TOKEN_DECIMALS,
  };
}

/** Burn + SOL cost labels — always from brandConfig mint economics */
export function getMintCostLabels(config) {
  const merged = mergeMintEconomics(config);
  const decimals = merged?.token_decimals ?? DEFAULT_TOKEN_DECIMALS;
  const burnRaw = merged?.burn_amount_raw ?? DEFAULT_BURN_AMOUNT_RAW;
  const solLamports = merged?.mint_surcharge_lamports ?? DEFAULT_MINT_SURCHARGE_LAMPORTS;

  const solAmount = lamportsToSol(solLamports);
  return {
    burnDisplay: formatBurnAmount(burnRaw, decimals),
    solDisplay: `${solAmount} SOL`,
    solAmount,
    mintButtonLabel: `Mint 1 Oppos Pass (${solAmount} SOL + Burn)`,
    priceSummary: `${formatBurnAmount(burnRaw, decimals)} $OPPOS + ${solAmount} SOL`,
  };
}
