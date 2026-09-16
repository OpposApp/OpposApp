import { loadEnvFiles, requireEnv, getRpcUrl } from "./load-env.js";

loadEnvFiles();

/**
 * Deploy Oppos Pass Core Collection + Candy Machine + Guards (devnet/mainnet).
 *
 * Requires:
 *   MINT_AUTHORITY_SECRET  — base58-encoded 64-byte secret key
 *   SOLANA_RPC_URL or HELIUS_RPC_URL (never VITE_ for paid keys)
 *   TOKEN_MINT             — $OPPOS mint (SPL Token burn, or Token-2022 payment to burn sink)
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
import { Connection, Keypair, PublicKey as Web3PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, keypairIdentity, none, publicKey, some, sol } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { addCollectionPlugin, createCollection, mplCore, ruleSet } from "@metaplex-foundation/mpl-core";
import {
  create,
  findCandyGuardPda,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-core-candy-machine";

/** Token-2022 candy guard has payment, not burn. Tokens are sent here so they cannot return. */
const INCINERATOR = "1nc1nerator11111111111111111111111111111111";

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
  return new Uint8Array(createHash("sha256").update(JSON.stringify({ name, uri })).digest());
}

async function ensureUpdateDelegate(umi, collectionMint) {
  await addCollectionPlugin(umi, {
    collection: collectionMint,
    plugin: {
      type: "UpdateDelegate",
      additionalDelegates: [],
    },
  }).sendAndConfirm(umi);
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

  const connection = new Connection(RPC, "confirmed");
  const mintPk = new Web3PublicKey(TOKEN_MINT);
  const mintInfo = await connection.getAccountInfo(mintPk, "confirmed");
  if (!mintInfo) {
    throw new Error(`TOKEN_MINT ${TOKEN_MINT} does not exist on this RPC`);
  }
  const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
  const tokenProgram = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const burnSink = (process.env.BURN_SINK_WALLET || INCINERATOR).trim();
  const burnSinkPk = new Web3PublicKey(burnSink);
  const burnAta = getAssociatedTokenAddressSync(mintPk, burnSinkPk, true, tokenProgram);

  console.log("Authority:", web3Keypair.publicKey.toBase58());
  console.log("RPC:", RPC.includes("devnet") ? "devnet" : "mainnet");
  console.log("TOKEN_MINT:", TOKEN_MINT, isToken2022 ? "(Token-2022)" : "(SPL Token)");
  if (isToken2022) {
    console.log("Guard: token2022Payment →", burnAta.toBase58(), `(owner ${burnSink})`);
  } else {
    console.log("Guard: tokenBurn", BURN_RAW.toString(), "raw");
  }

  if (isToken2022) {
    const ataIx = createAssociatedTokenAccountIdempotentInstruction(
      web3Keypair.publicKey,
      burnAta,
      burnSinkPk,
      mintPk,
      tokenProgram,
    );
    const ataTx = new Transaction().add(ataIx);
    ataTx.feePayer = web3Keypair.publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    ataTx.recentBlockhash = blockhash;
    ataTx.sign(web3Keypair);
    const ataSig = await connection.sendRawTransaction(ataTx.serialize(), {
      skipPreflight: false,
    });
    await connection.confirmTransaction(
      { signature: ataSig, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    console.log("Burn-sink ATA ready:", burnAta.toBase58());
  }

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
        {
          type: "UpdateDelegate",
          additionalDelegates: [],
        },
      ],
    }).sendAndConfirm(umi);
    collectionMint = collection.publicKey;
    console.log("   Collection:", collectionMint);
  }

  try {
    await ensureUpdateDelegate(umi, collectionMint);
    console.log("   UpdateDelegate plugin ready");
  } catch (err) {
    const msg = err?.message || String(err);
    if (/already exists|plugin already/i.test(msg)) {
      console.log("   UpdateDelegate already on collection");
    } else {
      throw err;
    }
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
    hiddenSettings: some({
      name: hiddenName,
      uri: PASS_URI,
      hash: hiddenHash(hiddenName, PASS_URI),
    }),
    configLineSettings: none(),
    guards: {
      solPayment: some({
        lamports: sol(MINT_SOL),
        destination: publicKey(TREASURY),
      }),
      ...(isToken2022
        ? {
            token2022Payment: some({
              amount: BURN_RAW,
              mint: publicKey(TOKEN_MINT),
              destinationAta: publicKey(burnAta.toBase58()),
            }),
          }
        : {
            tokenBurn: some({
              amount: BURN_RAW,
              mint: publicKey(TOKEN_MINT),
            }),
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
