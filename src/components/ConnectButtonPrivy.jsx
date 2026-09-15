import { useEffect, useState } from "react";
import { useConnectWallet, usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;
const READY_TIMEOUT_MS = 4000;

function originAllowed(allowedDomains, origin) {
  const current = origin.replace(/\/$/, "");
  return (allowedDomains ?? []).some((entry) => {
    const domain = String(entry).replace(/\/$/, "");
    return domain === current;
  });
}

export function ConnectButtonPrivy({ variant = "inline" }) {
  const { ready, logout } = usePrivy();
  const { wallets } = useWallets();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [waited, setWaited] = useState(false);

  const { connectWallet } = useConnectWallet({
    onSuccess: () => setError(null),
    onError: (err) => {
      console.error("[Privy] connect", err);
      setError(err?.message ?? "Wallet connection failed");
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!PRIVY_APP_ID || ready) {
      setBlocked(null);
      return;
    }

    const origin = window.location.origin;
    let cancelled = false;

    fetch(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => {
        if (cancelled || !cfg || originAllowed(cfg.allowed_domains, origin)) return;
        setBlocked(
          `Add ${origin} to Privy allowed domains (Dashboard → Configuration → App settings).`,
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [ready]);

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

  const isCta = variant === "cta";
  const address = wallets[0]?.address;
  const statusMessage = blocked
    ? blocked
    : waited && !ready
      ? "Wallet SDK didn't start. Check Privy allowed domains for this site."
      : null;

  const inlineClass =
    "font-serif text-sm text-white/60 hover:text-white border-b border-white/20 hover:border-white/60 pb-0.5 transition-all disabled:opacity-50";
  const ctaClass =
    "w-full py-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl";

  if (!ready && !address) {
    if (statusMessage) {
      return (
        <div className={isCta ? "w-full space-y-2 text-center" : "relative max-w-[220px]"}>
          <p
            className={
              isCta
                ? "text-xs text-amber-200/90 font-mono leading-relaxed"
                : "text-[10px] text-amber-200/80 font-mono leading-snug text-right"
            }
          >
            {statusMessage}
          </p>
        </div>
      );
    }

    return (
      <button
        type="button"
        className={
          isCta
            ? "w-full py-4 rounded-xl bg-white/10 text-white/40 font-semibold text-sm cursor-wait"
            : "font-mono text-xs text-white/30 tracking-wider"
        }
        disabled
      >
        Loading...
      </button>
    );
  }

  if (address) {
    return (
      <div className="relative">
        <button
          type="button"
          className={
            isCta
              ? ctaClass
              : "flex items-center gap-2 font-mono text-xs text-white/60 hover:text-white transition-colors tracking-wider"
          }
          disabled={busy}
          onClick={handleDisconnect}
          title="Click to disconnect wallet"
        >
          {!isCta && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
          )}
          {busy ? "..." : isCta ? `Connected ${address.slice(0, 4)}...${address.slice(-4)} · Disconnect` : `${address.slice(0, 4)}...${address.slice(-4)}`}
        </button>
        {error && (
          <p className="absolute right-0 top-full mt-2 max-w-[220px] text-right text-[10px] text-red-400/80 font-mono">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={isCta ? "w-full space-y-2" : "relative"}>
      <button
        type="button"
        className={isCta ? ctaClass : inlineClass}
        disabled={busy}
        onClick={handleConnect}
      >
        {busy ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && (
        <p
          className={
            isCta
              ? "text-xs text-red-400/80 font-mono text-center"
              : "absolute right-0 top-full mt-2 max-w-[200px] text-right text-[10px] text-red-400/80 font-mono"
          }
        >
          {error}
        </p>
      )}
    </div>
  );
}
