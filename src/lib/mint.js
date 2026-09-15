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

/** Build mintArgs for Oppos guards (solPayment + tokenBurn). */
function buildMintArgs(config, candyGuard) {
  const mintArgs = {};
  const treasury = publicKey(config.treasury_wallet);
  const tokenMint = publicKey(config.token_mint);

  const solPayment = candyGuard ? unwrapOption(candyGuard.guards?.solPayment) : null;
  mintArgs.solPayment = some({
    destination: solPayment?.destination ?? treasury,
  });
  mintArgs.tokenBurn = some({ mint: tokenMint });
  return mintArgs;
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
  const candyMachine = await fetchCandyMachine(umi, candyMachinePk);

  const guardPk = config.candy_guard
    ? publicKey(config.candy_guard)
    : candyMachine.mintAuthority;
  const candyGuard = await safeFetchCandyGuard(umi, guardPk);

  if (candyMachine.itemsRedeemed >= candyMachine.itemsAvailable) {
    throw new Error("Sold out — all Passes have been minted");
  }

  const asset = generateSigner(umi);
  const mintArgs = buildMintArgs(config, candyGuard);

  const result = await mintV1(umi, {
    candyMachine: candyMachine.publicKey,
    candyGuard: guardPk,
    collection: candyMachine.collectionMint,
    asset,
    mintArgs,
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

  const sig = result.signature;
  if (typeof sig === "string") return sig;
  if (sig instanceof Uint8Array) return bs58.encode(sig);
  return String(sig);
}

/** Preflight: wallet has signTransaction and CM exists. */
export function assertWalletCanMint(wallet) {
  createSignerFromWalletAdapter(toWalletAdapter(wallet));
}
