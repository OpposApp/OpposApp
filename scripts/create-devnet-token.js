/**
 * Create $OPPOS test SPL token on Solana devnet (6 decimals).
 *
 * Requires: MINT_AUTHORITY_SECRET in .env.local
 * Run: npm run create-devnet-token
 *
 * Then set TOKEN_MINT=<printed mint> in .env.local and run setup-candy-machine.
 */
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { loadEnvFiles, requireEnv, getRpcUrl } from "./load-env.js";
import { ensureDevnetSol } from "./devnet-faucet.js";

const DECIMALS = 6;
/** 10M tokens — enough for devnet mint tests (22k burn × many mints) */
const SUPPLY_HUMAN = 10_000_000;

loadEnvFiles();

async function main() {
  requireEnv(
    "MINT_AUTHORITY_SECRET",
    "paste base58 private key of your devnet deploy wallet",
  );

  const rpc = getRpcUrl();
  if (!rpc.includes("devnet") && !process.env.ALLOW_MAINNET_TOKEN) {
    throw new Error(
      "Refusing to create test token on non-devnet RPC. Set SOLANA_RPC_URL to devnet or ALLOW_MAINNET_TOKEN=1",
    );
  }

  const payer = Keypair.fromSecretKey(
    bs58.decode(process.env.MINT_AUTHORITY_SECRET.trim()),
  );
  console.log("RPC:", rpc);
  console.log("Authority:", payer.publicKey.toBase58());

  const connection = await ensureDevnetSol(payer.publicKey, { rpc, minSol: 0.12 });

  console.log("\nCreating SPL mint (6 decimals)…");
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    DECIMALS,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
  );

  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );

  const rawAmount = BigInt(SUPPLY_HUMAN) * 10n ** BigInt(DECIMALS);
  await mintTo(connection, payer, mint, ata.address, payer, rawAmount);

  console.log("\n✅ Devnet test token ready\n");
  console.log("TOKEN_MINT=", mint.toBase58());
  console.log("Your ATA:   ", ata.address.toBase58());
  console.log(`Balance:    ${SUPPLY_HUMAN.toLocaleString()} OPPOS-TEST`);
  console.log("\nAdd to .env.local:");
  console.log(`TOKEN_MINT=${mint.toBase58()}`);
  console.log("\nNext:");
  console.log("  1. Set TREASURY_WALLET (can be same pubkey as authority for devnet)");
  console.log("  2. npm run setup-candy-machine");
  console.log("  3. npm run airdrop-test-tokens -- <wallet-to-test-mint>");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
