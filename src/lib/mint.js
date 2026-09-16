import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, publicKey, some, unwrapOption } from "@metaplex-foundation/umi";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  fetchCandyMachine,
  mintV1,
  mplCandyMachine,
  safeFetchCandyGuard,
} from "@metaplex-foundation/mpl-core-candy-machine";
import {
  createSignerFromWalletAdapter,
  walletAdapterIdentity,
} from "@metaplex-foundation/umi-signer-wallet-adapters";
import { SOLANA_RPC } from "./env.js";

function toWalletAdapter(wallet) {
  if (!wallet?.publicKey) {
    throw new Error("Wallet not connected");
  }
  if (!wallet.signTransaction) {
    throw new Error("Wallet cannot sign transactions — reconnect and try again");
  }
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions?.bind(wallet),
  };
}

function createMintUmi(wallet) {
  const adapter = toWalletAdapter(wallet);
  return createUmi(SOLANA_RPC)
    .use(mplCore())
    .use(mplCandyMachine())
    .use(walletAdapterIdentity(adapter));
}

function unwrapGuard(option) {
  if (option == null) return null;
  try {
    return unwrapOption(option) ?? null;
  } catch {
    return null;
  }
}

/** Build mintArgs from the live Candy Guard (solPayment + tokenBurn or token2022Payment). */
function buildMintArgs(config, candyGuard) {
  const mintArgs = {};
  const treasury = publicKey(config.treasury_wallet);
  const tokenMint = publicKey(config.token_mint);

  const solPayment = unwrapGuard(candyGuard?.guards?.solPayment);
  mintArgs.solPayment = some({
    destination: solPayment?.destination ?? treasury,
  });

  const tokenBurn = unwrapGuard(candyGuard?.guards?.tokenBurn);
  if (tokenBurn) {
    mintArgs.tokenBurn = some({ mint: tokenBurn.mint ?? tokenMint });
  }

  const token2022Payment = unwrapGuard(candyGuard?.guards?.token2022Payment);
  if (token2022Payment) {
    mintArgs.token2022Payment = some({
      mint: token2022Payment.mint ?? tokenMint,
      destinationAta: token2022Payment.destinationAta,
    });
  }

  return mintArgs;
}

export function formatMintError(err) {
  const raw = err?.message || String(err);
  if (/account of type \[CandyMachine\] was not found/i.test(raw) || /CandyMachine was not found/i.test(raw)) {
    return "Pass Candy Machine is not on this network yet. Mainnet mint is not live at the configured address.";
  }
  if (/account of type \[CandyGuard\] was not found/i.test(raw)) {
    return "Candy Guard is missing on this network — mint is blocked until guards are deployed.";
  }
  if (/insufficient/i.test(raw) && /sol/i.test(raw)) {
    return "Not enough SOL — mint costs 0.2 SOL plus network fees.";
  }
  if (/insufficient/i.test(raw) || /token/i.test(raw) && /balance/i.test(raw)) {
    return "Not enough $OPPOS in this wallet for the mint burn/payment.";
  }
  return raw;
}

/**
 * Mint 1 Oppos Pass via Core Candy Machine + Candy Guard.
 * @returns {Promise<string>} transaction signature (base58)
 */
export async function mintPassFromCandyMachine({ wallet, config }) {
  if (!config?.candy_machine) {
    throw new Error("Candy Machine not configured — run setup-candy-machine and update Supabase");
  }

  const umi = createMintUmi(wallet);
  const candyMachinePk = publicKey(config.candy_machine);
  let candyMachine;
  try {
    candyMachine = await fetchCandyMachine(umi, candyMachinePk);
  } catch (err) {
    throw new Error(formatMintError(err));
  }

  const guardPk = config.candy_guard
    ? publicKey(config.candy_guard)
    : candyMachine.mintAuthority;
  const candyGuard = await safeFetchCandyGuard(umi, guardPk);
  if (!candyGuard) {
    throw new Error(
      "Candy Guard not found at the configured address — mint would skip 0.2 SOL + burn. Update project_config.candy_guard.",
    );
  }

  if (candyMachine.itemsRedeemed >= candyMachine.itemsAvailable) {
    throw new Error("Sold out — all Passes have been minted");
  }

  const asset = generateSigner(umi);
  const mintArgs = buildMintArgs(config, candyGuard);

  let result;
  try {
    result = await mintV1(umi, {
      candyMachine: candyMachine.publicKey,
      candyGuard: guardPk,
      collection: candyMachine.collectionMint,
      asset,
      mintArgs,
    }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
  } catch (err) {
    throw new Error(formatMintError(err));
  }

  const sig = result.signature;
  if (typeof sig === "string") return sig;
  if (sig instanceof Uint8Array) return bs58.encode(sig);
  return String(sig);
}

/** Preflight: wallet has signTransaction and CM exists. */
export function assertWalletCanMint(wallet) {
  createSignerFromWalletAdapter(toWalletAdapter(wallet));
}
