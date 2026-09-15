import { useState } from "react";
import { useConnectWallet, usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

export function ConnectButtonPrivy() {
  const { ready, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const { connectWallet } = useConnectWallet({
    onSuccess: () => setError(null),
    onError: (err) => {
      console.error("[Privy] connect", err);
      setError(err?.message ?? "Wallet connection failed");
    },
  });

  async function handleConnect() {
    setError(null);
    setBusy(true);
    try {
      await connectWallet({ walletChainType: "solana" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setError(null);
    setBusy(true);
    try {
      const wallet = wallets[0];
      if (wallet) await wallet.disconnect();
      await logout();
    } catch (err) {
      console.error("[Privy] disconnect", err);
      setError(err?.message ?? "Failed to disconnect");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !walletsReady) {
    return (
      <button
        type="button"
        className="font-mono text-xs text-white/30 tracking-wider"
        disabled
      >
        Loading...
      </button>
    );
  }

  const address = wallets[0]?.address;

  if (address) {
    return (
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 font-mono text-xs text-white/60 hover:text-white transition-colors tracking-wider"
          disabled={busy}
          onClick={handleDisconnect}
          title="Click to disconnect wallet"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {busy ? "..." : `${address.slice(0, 4)}...${address.slice(-4)}`}
        </button>
        {error && (
          <p className="absolute right-0 top-full mt-2 max-w-[200px] text-right text-[10px] text-red-400/80 font-mono">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="font-serif text-sm text-white/60 hover:text-white border-b border-white/20 hover:border-white/60 pb-0.5 transition-all"
        disabled={busy}
        onClick={handleConnect}
      >
        {busy ? "Connecting..." : "Connect"}
      </button>
      {error && (
        <p className="absolute right-0 top-full mt-2 max-w-[200px] text-right text-[10px] text-red-400/80 font-mono">
          {error}
        </p>
      )}
    </div>
  );
}
