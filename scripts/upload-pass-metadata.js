/**
 * Upload Pass art + Metaplex metadata to Arweave via Irys (pay with SOL).
 *
 * Dry-run (default):  npm run upload-metadata
 * Real upload:        ALLOW_IRYS_UPLOAD=1 npm run upload-metadata
 *
 * Needs mainnet SOL on the key in MINT_AUTHORITY_SECRET (or IRYS_SECRET).
 * Devnet SOL cannot pay Irys. Do not use the payout treasury.
 *
 * Order: PNG first → rewrite JSON image URLs → upload JSON → print URIs
 * to paste into PASS_METADATA_URI / COLLECTION_METADATA_URI.
 */
import { writeFileSync, readFileSync, statSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { loadEnvFiles, requireEnv } from "./load-env.js";

loadEnvFiles();

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PNG = resolve(root, "public/NFT.png");
const PASS_JSON = resolve(root, "public/metadata/pass.json");
const COLLECTION_JSON = resolve(root, "public/metadata/collection.json");
const LIVE = process.env.ALLOW_IRYS_UPLOAD === "1";
const GATEWAY = "https://gateway.irys.xyz";

function walletBytes() {
  const secret = requireEnv(
    process.env.IRYS_SECRET ? "IRYS_SECRET" : "MINT_AUTHORITY_SECRET",
    "base58 private key of a wallet that has mainnet SOL",
  );
  try {
    return Keypair.fromSecretKey(bs58.decode(secret)).secretKey;
  } catch {
    throw new Error("IRYS/MINT_AUTHORITY_SECRET is not valid base58");
  }
}

function payRpc() {
  return (
    process.env.IRYS_SOLANA_RPC_URL ||
    process.env.HELIUS_RPC_URL ||
    "https://api.mainnet-beta.solana.com"
  );
}

async function getUploader() {
  const { Uploader } = await import("@irys/upload");
  const { Solana } = await import("@irys/upload-solana");
  return Uploader(Solana).withWallet(walletBytes()).withRpc(payRpc());
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const irys = await getUploader();
  const address = irys.address;
  const pngBytes = statSync(PNG).size;
  const jsonBytes = statSync(PASS_JSON).size + statSync(COLLECTION_JSON).size;
  const price = await irys.getPrice(pngBytes + jsonBytes + 2048);
  const sol = irys.utils.fromAtomic(price).toString();
  const loadedAtomic = await irys.getLoadedBalance();
  const loadedSol = irys.utils.fromAtomic(loadedAtomic).toString();

  console.log(
    JSON.stringify(
      {
        mode: LIVE ? "upload" : "dry-run",
        payer: address,
        payRpc: payRpc().includes("devnet") ? "devnet (will fail)" : "mainnet-or-helius",
        pngMb: Number((pngBytes / 1e6).toFixed(2)),
        estimatedSol: sol,
        irysPrepaidSol: loadedSol,
        note: "Wallet SOL and Irys prepaid balance are separate. Upload spends Irys balance.",
      },
      null,
      2,
    ),
  );

  if (payRpc().includes("devnet")) {
    throw new Error("Irys needs mainnet SOL. Set IRYS_SOLANA_RPC_URL or HELIUS_RPC_URL to mainnet.");
  }

  if (!LIVE) {
    console.log("\nNo upload. To pay and pin forever:\n  ALLOW_IRYS_UPLOAD=1 npm run upload-metadata\n");
    return;
  }

  // Irys 402 = prepaid node balance is 0. Move a tiny bit of wallet SOL onto Irys first.
  if (Number(loadedSol) < Number(sol) * 2) {
    const fundSol = "0.001";
    console.log(`Funding Irys prepaid balance with ${fundSol} SOL from wallet…`);
    await irys.fund(irys.utils.toAtomic(fundSol));
  }

  const png = await irys.uploadFile(PNG, {
    tags: [{ name: "Content-Type", value: "image/png" }],
  });
  const image = `${GATEWAY}/${png.id}`;

  const pass = JSON.parse(readFileSync(PASS_JSON, "utf8"));
  pass.image = image;
  pass.properties = pass.properties ?? {};
  pass.properties.files = [{ uri: image, type: "image/png" }];
  writeJson(PASS_JSON, pass);

  const collection = JSON.parse(readFileSync(COLLECTION_JSON, "utf8"));
  collection.image = image;
  collection.properties = collection.properties ?? {};
  collection.properties.files = [{ uri: image, type: "image/png" }];
  writeJson(COLLECTION_JSON, collection);

  const passReceipt = await irys.uploadFile(PASS_JSON, {
    tags: [{ name: "Content-Type", value: "application/json" }],
  });
  const collectionReceipt = await irys.uploadFile(COLLECTION_JSON, {
    tags: [{ name: "Content-Type", value: "application/json" }],
  });

  console.log(
    JSON.stringify(
      {
        image,
        PASS_METADATA_URI: `${GATEWAY}/${passReceipt.id}`,
        COLLECTION_METADATA_URI: `${GATEWAY}/${collectionReceipt.id}`,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
