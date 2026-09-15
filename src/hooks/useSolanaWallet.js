import { useMemo } from "react";
import { Connection } from "@solana/web3.js";
import { isPrivyConfigured, SOLANA_RPC } from "../lib/env.js";
import { useSolanaWalletPrivy } from "./useSolanaWalletPrivy.js";

function useSolanaWalletFallback() {
  const connection = useMemo(() => new Connection(SOLANA_RPC, "confirmed"), []);
  return useMemo(
    () => ({
      connection,
      wallet: null,
      publicKey: null,
      connected: false,
      ready: true,
      solanaWallet: null,
    }),
    [connection],
  );
}

/** Resolved once at module load — safe for Rules of Hooks per build. */
export const useSolanaWallet = isPrivyConfigured
  ? useSolanaWalletPrivy
  : useSolanaWalletFallback;
