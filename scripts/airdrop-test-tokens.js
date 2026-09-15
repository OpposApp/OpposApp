/**
 * Send devnet OPPOS-TEST tokens + SOL to a wallet for mint UI testing.
 *
 * Usage:
 *   npm run airdrop-test-tokens -- <RECIPIENT_PUBKEY>
 *   RECIPIENT_WALLET=... npm run airdrop-test-tokens
 *
 * Requires: MINT_AUTHORITY_SECRET, TOKEN_MINT in .env.local
 */
import bs58 from "bs58";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
} from "@solana/spl-token";
import { loadEnvFiles, requireEnv, getRpcUrl } from "./load-env.js";
import { ensureDevnetSol } from "./devnet-faucet.js";

const SEND_TOKENS = 100_000; // human units (enough for several 22k burns)
const DECIMALS = 6;

loadEnvFiles();

async function main() {
  const recipientArg = process.argv[2] || process.env.RECIPIENT_WALLET;
  if (!recipientArg) {
    throw new Error("Pass recipient pubkey: npm run airdrop-test-tokens -- <WALLET>");
  }

  requireEnv("MINT_AUTHORITY_SECRET", "deploy wallet secret");
  requireEnv("TOKEN_MINT", "run npm run create-devnet-token first");

  const recipient = new PublicKey(recipientArg);
  const payer = Keypair.fromSecretKey(
    bs58.decode(process.env.MINT_AUTHORITY_SECRET.trim()),
  );
  const mint = new PublicKey(process.env.TOKEN_MINT.trim());
  const rpc = getRpcUrl();
  if (!rpc.includes("devnet") && process.env.ALLOW_MAINNET_TOKEN !== "1") {
    throw new Error(
      "Refusing token airdrop on non-devnet RPC. Set SOLANA_RPC_URL to devnet or ALLOW_MAINNET_TOKEN=1",
    );
  }
  console.log("Sending to:", recipient.toBase58());

  await ensureDevnetSol(payer.publicKey, { rpc, minSol: 0.05 });
  const connection = await ensureDevnetSol(recipient, { rpc, minSol: 0.25 });

  const fromAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );
  const toAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient,
  );

  const raw = BigInt(SEND_TOKENS) * 10n ** BigInt(DECIMALS);
  await transfer(connection, payer, fromAta.address, toAta.address, payer, raw);
  console.log(`✓ ${SEND_TOKENS.toLocaleString()} test tokens sent`);
  console.log("\nWallet can now test mint on localhost (Phantom → Devnet).");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
