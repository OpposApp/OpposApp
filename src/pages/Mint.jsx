import { useEffect, useState } from "react";
import { fetchProjectConfig } from "../lib/supabase";
import { fetchMintedSupply, fetchWalletPasses } from "../lib/passes.js";
import { getMintReadiness, mintPass, solscanAccount, solscanTx } from "../lib/solana";
import { getMintCostLabels } from "../lib/mintConfig.js";
import { useSolanaWallet } from "../hooks/useSolanaWallet.js";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { SupplyProgress } from "../components/ui/SupplyProgress.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { PassPreviewCard } from "../components/ui/PassPreviewCard.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { isPrivyConfigured } from "../lib/env.js";

export function MintPage() {
  const { wallet, connected, publicKey, ready } = useSolanaWallet();
  const [config, setConfig] = useState(null);
  const [minted, setMinted] = useState(0);
  const [myPasses, setMyPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchProjectConfig()
      .then(async (cfg) => {
        if (cancelled) return;
        setConfig(cfg);
        setMinted(await fetchMintedSupply(cfg));
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!publicKey) {
      setMyPasses([]);
      return;
    }
    if (!config) return;
    fetchWalletPasses(publicKey.toBase58(), config)
      .then(setMyPasses)
      .catch(() => setMyPasses([]));
  }, [publicKey, config]);

  const [txSignature, setTxSignature] = useState(null);

  async function handleMint() {
    setError(null);
    setTxSignature(null);
    setLoading(true);
    try {
      const sig = await mintPass({ wallet, config });
      setTxSignature(sig);
      const newCount = await fetchMintedSupply(config);
      setMinted(newCount);
      if (publicKey) {
        const passes = await fetchWalletPasses(publicKey.toBase58(), config);
        setMyPasses(passes);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const maxSupply = config?.max_supply ?? 2222;
  const soldOut = minted >= maxSupply;
  const remaining = Math.max(0, maxSupply - minted);
  const mintBlocked = getMintReadiness(config);
  const { burnDisplay, solDisplay } = getMintCostLabels(config);

  if (pageLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-full max-w-xl" />
        <div className="grid gap-8 lg:grid-cols-12">
          <Skeleton className="h-80 lg:col-span-5" />
          <Skeleton className="h-80 lg:col-span-7" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {!isPrivyConfigured && (
        <p className="text-xs text-amber-400/80 font-mono border border-amber-500/20 bg-amber-500/5 rounded-lg px-4 py-3">
          Wallet connect is disabled — add VITE_PRIVY_APP_ID to .env.local
        </p>
      )}

      <PageHeader
        eyebrow="Mint Terminal"
        title="Mint Your Revenue Pass"
        description={`Burn $OPPOS permanently, pay ${solDisplay}, receive 1 Pass NFT to your wallet.`}
      />

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Left: Visual Card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <PassPreviewCard serial={String(Math.min(minted + 1, maxSupply)).padStart(4, "0")} />
          <div className="border-t border-white/[0.08] pt-4">
            <SupplyProgress minted={minted} max={maxSupply} />
            <p className="mt-3 text-xs text-white/25 font-mono">
              {remaining} remaining
            </p>
          </div>
        </div>

        {/* Right: Mint Form */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Requirements</h3>
                <p className="text-xs text-white/30 font-mono mt-1">Single atomic transaction</p>
              </div>
              <span className="font-mono text-xs text-white/30 uppercase tracking-widest">Phase 1</span>
            </div>

            <div className="space-y-0">
              <div className="row-item">
                <div className="flex items-center gap-3">
                  <span className="text-sm">🔥</span>
                  <div>
                    <p className="text-sm font-serif font-bold text-white">$OPPOS Burn</p>
                    <p className="text-[11px] text-white/25 font-mono">Permanently burned</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-white">{burnDisplay}</span>
              </div>

              <div className="row-item">
                <div className="flex items-center gap-3">
                  <span className="text-sm">◎</span>
                  <div>
                    <p className="text-sm font-serif font-bold text-white">SOL Surcharge</p>
                    <p className="text-[11px] text-white/25 font-mono">To treasury wallet</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-white">{solDisplay}</span>
              </div>

              <div className="row-item">
                <div className="flex items-center gap-3">
                  <span className="text-sm">◆</span>
                  <div>
                    <p className="text-sm font-serif font-bold text-white">You Receive</p>
                    <p className="text-[11px] text-white/25 font-mono">50% revenue-share</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-white">1 Pass NFT</span>
              </div>
            </div>

            {!connected && (
              <p className="text-xs text-white/25 border-t border-white/[0.08] pt-4 font-mono">
                Connect your wallet to proceed →
              </p>
            )}

            {mintBlocked && (
              <p className="text-xs text-amber-300/90 border border-amber-500/20 bg-amber-500/5 rounded-lg px-4 py-3 font-mono">
                ⚠ {mintBlocked}
              </p>
            )}

            <button
              type="button"
              className="btn-primary w-full py-4 text-base font-bold tracking-wide"
              disabled={!ready || !connected || soldOut || loading || !!mintBlocked}
              onClick={handleMint}
            >
              {!ready
                ? "Preparing Wallet..."
                : !connected
                ? "Connect Wallet First"
                : mintBlocked
                  ? "Mint Not Ready"
                  : soldOut
                    ? "Sold Out"
                    : loading
                      ? "Confirming..."
                      : "Mint Pass Now"}
            </button>

            {txSignature && (
              <p className="text-xs text-emerald-400 font-mono border-t border-white/[0.08] pt-3 break-all">
                ✓ Minted!{" "}
                <a
                  href={solscanTx(txSignature)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-emerald-300"
                >
                  View on Solscan
                </a>
              </p>
            )}

            {error && (
              <p className="text-xs text-red-400/70 font-mono border-t border-white/[0.08] pt-3">
                ⚠ {error}
              </p>
            )}
          </div>

          {/* User Passes */}
          {connected && myPasses.length > 0 && (
            <div className="border-t border-white/[0.08] pt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-white">Your Passes</h3>
                <span className="font-mono text-xs text-white/30">
                  {myPasses.length} owned
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {myPasses.map((p) => (
                  <div
                    key={p.asset_address}
                    className="flex items-center justify-between border border-white/[0.08] p-4"
                  >
                    <div>
                      <p className="font-mono text-xs font-bold text-white">Pass #{p.serial}</p>
                      {p.minted_at && (
                        <p className="text-[10px] text-white/20 font-mono">
                          {new Date(p.minted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <a
                      href={p.mint_tx ? solscanTx(p.mint_tx) : solscanAccount(p.asset_address)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-white/40 hover:text-white transition-colors"
                    >
                      Solscan ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
