import { useMemo } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { SOLANA_RPC } from "../lib/env.js";
import { toLegacyWalletAdapter } from "../lib/solanaWalletAdapter.js";

export function useSolanaWalletPrivy() {
  const { ready: privyReady } = usePrivy();
  const { wallets } = useWallets();

  const connection = useMemo(() => new Connection(SOLANA_RPC, "confirmed"), []);
  const solanaWallet = wallets[0] ?? null;

  const publicKey = useMemo(() => {
    if (!solanaWallet?.address) return null;
    try {
      return new PublicKey(solanaWallet.address);
    } catch {
      return null;
    }
  }, [solanaWallet?.address]);

  const wallet = useMemo(() => {
    if (!solanaWallet || !publicKey) return null;
    const adapter = toLegacyWalletAdapter(solanaWallet, publicKey);
    if (!adapter) return null;
    return { ...adapter, solanaWallet };
  }, [solanaWallet, publicKey]);

  return {
    connection,
    wallet,
    publicKey,
    connected: !!publicKey,
    ready: privyReady,
    solanaWallet,
  };
}
