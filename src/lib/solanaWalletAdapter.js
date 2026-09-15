import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { isDevnetRpc } from "./env.js";

function solanaChainId() {
  return isDevnetRpc ? "solana:devnet" : "solana:mainnet";
}

function serializeForSigning(transaction) {
  if (transaction instanceof VersionedTransaction) {
    return transaction.serialize();
  }
  return transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
}

function deserializeSigned(bytes) {
  try {
    return VersionedTransaction.deserialize(bytes);
  } catch {
    return Transaction.from(bytes);
  }
}

/**
 * Bridge Privy ConnectedStandardSolanaWallet → legacy wallet-adapter shape
 * expected by @metaplex-foundation/umi-signer-wallet-adapters.
 */
export function toLegacyWalletAdapter(solanaWallet, publicKey) {
  if (!solanaWallet || !publicKey) return null;

  const chain = solanaChainId();

  return {
    publicKey,
    connected: true,
    signTransaction: async (transaction) => {
      const { signedTransaction } = await solanaWallet.signTransaction({
        transaction: Uint8Array.from(serializeForSigning(transaction)),
        chain,
      });
      return deserializeSigned(signedTransaction);
    },
    signAllTransactions: async (transactions) => {
      const inputs = transactions.map((transaction) => ({
        transaction: Uint8Array.from(serializeForSigning(transaction)),
        chain,
      }));
      const outputs = await solanaWallet.signTransaction(...inputs);
      const list = Array.isArray(outputs) ? outputs : [outputs];
      return list.map(({ signedTransaction }) => deserializeSigned(signedTransaction));
    },
  };
}
