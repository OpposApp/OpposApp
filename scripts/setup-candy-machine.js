import { loadEnvFiles, requireEnv, getRpcUrl } from "./load-env.js";

loadEnvFiles();

/**
 * Deploy Oppos Pass Core Collection + Candy Machine + Guards (devnet/mainnet).
 *
 * Requires:
 *   MINT_AUTHORITY_SECRET  — base58-encoded 64-byte secret key
 *   SOLANA_RPC_URL or HELIUS_RPC_URL or VITE_HELIUS_RPC_URL
 *   TOKEN_MINT             — $OPPOS SPL mint (must exist; user ATAs need balance to mint)
 *   TREASURY_WALLET        — receives 0.2 SOL per mint
 *
 * Optional:
 *   CANDY_ITEMS=2222
 *   MINT_SOL=0.2
 *   BURN_AMOUNT_RAW=22222000000
 *   PASS_METADATA_URI      — arweave/https JSON for Pass art
 *   COLLECTION_METADATA_URI
 *
 * Run: npm run setup-candy-machine
 */
import { createHash } from "crypto";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, keypairIdentity, publicKey, some, sol } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { createCollection, mplCore, ruleSet } from "@metaplex-foundation/mpl-core";
import {
  create,
  findCandyGuardPda,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-core-candy-machine";

const RPC = getRpcUrl();
const ITEMS = Number(process.env.CANDY_ITEMS ?? 2222);
const MINT_SOL = Number(process.env.MINT_SOL ?? 0.2);
const BURN_RAW = BigInt(process.env.BURN_AMOUNT_RAW ?? 22_222_000_000n);
/** Secondary-market royalty only (not charged on Candy Machine mint). 500 = 5%. */
const ROYALTY_BPS = Number(process.env.ROYALTY_BPS ?? 220);
const PASS_URI =
  process.env.PASS_METADATA_URI ||
  "https://arweave.net/oppos-pass-metadata-placeholder";
const COLLECTION_URI =
  process.env.COLLECTION_METADATA_URI ||
  "https://arweave.net/oppos-pass-collection-placeholder";

function hiddenHash(name, uri) {
  return createHash("sha256").update(JSON.stringify({ name, uri })).digest();
}

async function main() {
  requireEnv(
    "MINT_AUTHORITY_SECRET",
    "paste the base58 private key of your deploy wallet (needs devnet SOL)",
  );
  const TOKEN_MINT = requireEnv("TOKEN_MINT", "set your $OPPOS token mint address");
  const TREASURY = requireEnv("TREASURY_WALLET", "set the pubkey that receives 0.2 SOL per mint");

  const secret = process.env.MINT_AUTHORITY_SECRET.trim();
  let web3Keypair;
  try {
    web3Keypair = Keypair.fromSecretKey(bs58.decode(secret));
  } catch {
    throw new Error(
      "MINT_AUTHORITY_SECRET is not valid base58 — export private key from Phantom/Solflare",
    );
  }
  if (!RPC.includes("devnet") && process.env.ALLOW_MAINNET_DEPLOY !== "1") {
    throw new Error(
      "Refusing Candy Machine deploy on non-devnet RPC. Set SOLANA_RPC_URL to devnet or ALLOW_MAINNET_DEPLOY=1",
    );
  }

  const umi = createUmi(RPC)
    .use(mplCore())
    .use(mplCandyMachine())
    .use(keypairIdentity(fromWeb3JsKeypair(web3Keypair)));

  console.log("Authority:", web3Keypair.publicKey.toBase58());
  console.log("RPC:", RPC);

  let collectionMint;
  const existingCollection = process.env.COLLECTION_MINT?.trim();
  if (existingCollection && !existingCollection.includes("YOUR_")) {
    collectionMint = publicKey(existingCollection);
    console.log("\n1/2 Using existing collection:", collectionMint);
    console.log("   Royalties plugin is not added on reuse — new collection needed for secondary tax.");
  } else {
    const collection = generateSigner(umi);
    console.log("\n1/2 Creating Core collection…");
    if (ROYALTY_BPS < 0 || ROYALTY_BPS > 10_000) {
      throw new Error("ROYALTY_BPS must be 0–10000 (10000 = 100%)");
    }
    await createCollection(umi, {
      collection,
      name: "Oppos Pass",
      uri: COLLECTION_URI,
      plugins: [
        {
          type: "Royalties",
          basisPoints: ROYALTY_BPS,
          creators: [{ address: publicKey(TREASURY), percentage: 100 }],
          ruleSet: ruleSet("None"),
        },
      ],
    }).sendAndConfirm(umi);
    collectionMint = collection.publicKey;
    console.log("   Collection:", collectionMint);
  }

  const candyMachine = generateSigner(umi);
  const hiddenName = "OPPOS Pass #";
  console.log("\n2/2 Creating Candy Machine + Guards…");
  const cmBuilder = await create(umi, {
    candyMachine,
    collection: collectionMint,
    collectionUpdateAuthority: umi.identity,
    itemsAvailable: ITEMS,
    isMutable: true,
    hiddenSettings: {
      name: hiddenName,
      uri: PASS_URI,
      hash: hiddenHash(hiddenName, PASS_URI),
    },
    guards: {
      solPayment: some({
        lamports: sol(MINT_SOL),
        destination: publicKey(TREASURY),
      }),
      tokenBurn: some({
        amount: BURN_RAW,
        mint: publicKey(TOKEN_MINT),
      }),
    },
  });
  await cmBuilder.sendAndConfirm(umi);

  const candyGuardPda = findCandyGuardPda(umi, { base: candyMachine.publicKey });
  const candyGuard = Array.isArray(candyGuardPda) ? candyGuardPda[0] : candyGuardPda;

  console.log("\n✅ Deploy complete\n");
  console.log("collection_mint:", collectionMint);
  console.log("candy_machine:  ", candyMachine.publicKey);
  console.log("candy_guard:    ", candyGuard);
  console.log(
    `secondary royalty: ${ROYALTY_BPS / 100}% → ${TREASURY} (Magic Eden / Tensor; mint stays 0.2 SOL + burn, no extra tax)`,
  );
  console.log("\nUpdate Supabase project_config:");
  console.log(`  collection_mint = '${collectionMint}'`);
  console.log(`  candy_machine   = '${candyMachine.publicKey}'`);
  console.log(`  candy_guard     = '${candyGuard}'`);
  console.log(`  token_mint      = '${TOKEN_MINT}'`);
  console.log(`  treasury_wallet = '${TREASURY}'`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
