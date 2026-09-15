import { useEffect, useState } from "react";
import { fetchProjectConfig } from "../../../lib/supabase";
import { fetchMintedSupply, fetchWalletPasses, waitForIndexedSupply } from "../../../lib/passes.js";
import { getMintReadiness, mintPass, solscanTx } from "../../../lib/solana";
import { getMintCostLabels } from "../../../lib/mintConfig.js";
import { useSolanaWallet } from "../../../hooks/useSolanaWallet.js";
import { ConnectButton } from "../../ConnectButton.jsx";
import { SupplyProgress } from "../SupplyProgress.jsx";
import { PassPreviewCard } from "../PassPreviewCard.jsx";
import { officeStore } from "../../../context/useOfficeStore";
import { X, Sparkles, Flame, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export function MintModal() {
  const { wallet, connected, publicKey, ready } = useSolanaWallet();
  const [config, setConfig] = useState(null);
  const [minted, setMinted] = useState(0);
  const [myPasses, setMyPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);
  const [error, setError] = useState(null);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        officeStore.requestCloseModals();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  async function handleMint() {
    setError(null);
    setTxSignature(null);
    setLoading(true);
    try {
      const sig = await mintPass({ wallet, config });
      setTxSignature(sig);
      const optimistic = Math.min(minted + 1, maxSupply);
      setMinted(optimistic);
      if (publicKey) {
        setMyPasses((prev) => {
          if (prev.some((p) => p.mint_tx === sig)) return prev;
          return [
            ...prev,
            {
              serial: "…",
              asset_address: `pending:${sig}`,
              mint_tx: sig,
              minted_at: new Date().toISOString(),
            },
          ];
        });
      }
      void waitForIndexedSupply(optimistic).then(async (indexed) => {
        setMinted((n) => Math.max(n, indexed));
        if (!publicKey) return;
        const passes = await fetchWalletPasses(publicKey.toBase58());
        if (passes.length) setMyPasses(passes);
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const maxSupply = config?.max_supply ?? 2222;
  const soldOut = minted >= maxSupply;
  const mintBlocked = getMintReadiness(config);
  const { burnDisplay, solDisplay, mintButtonLabel } = getMintCostLabels(config);

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold tracking-tight">Mint OPPOS Pass</h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                  SOLANA CORE
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {maxSupply.toLocaleString()} max supply · 50% holder split designed · payout job not live
              </p>
            </div>
          </div>

          <button
            onClick={() => officeStore.requestCloseModals()}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="mt-6 grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: 3D Pass Preview & Supply */}
          <div className="lg:col-span-5 space-y-6">
            <PassPreviewCard serial={String(Math.min(minted + 1, maxSupply)).padStart(4, "0")} />

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SupplyProgress minted={minted} max={maxSupply} />
            </div>

            {/* Wallet Owned Passes */}
            {connected && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 font-mono text-xs">
                <div className="flex justify-between text-white/60 mb-2">
                  <span>Your Passes Owned:</span>
                  <span className="text-white font-bold">{myPasses.length}</span>
                </div>
                {myPasses.length > 0 && (
                  <p className="text-[11px] text-emerald-400">
                    ✓ {myPasses.length} share(s) of the 50% holder pool once the payout job is live.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Mint Action & Mechanics */}
          <div className="lg:col-span-7 space-y-6">
            {/* Mint Rules Card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4 font-mono text-xs">
              <p className="text-[11px] text-white/40 uppercase tracking-wider">MINT REQUIREMENTS</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-400" />
                    Burn $OPPOS:
                  </span>
                  <span className="text-orange-400 font-bold">{burnDisplay} $OPPOS</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-white/60">Fixed SOL Cost:</span>
                  <span className="text-white font-bold">{solDisplay}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Revenue Split:</span>
                  <span className="text-emerald-400 font-bold">50% to Pass Holders</span>
                </div>
              </div>
            </div>

            {/* Error or Success feedback */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-mono text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                <span className="break-all">{error}</span>
              </div>
            )}

            {txSignature && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-300 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold">Pass Minted Successfully!</span>
                </div>
                <a
                  href={solscanTx(txSignature)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline block truncate"
                >
                  View on Solscan: {txSignature}
                </a>
              </div>
            )}

            {mintBlocked && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-mono text-amber-200/90">
                ⚠ {mintBlocked}
              </div>
            )}

            {/* Wallet Connect & Mint Button */}
            <div className="space-y-3 pt-2">
              {!connected ? (
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                  <p className="text-xs text-white/70 text-center">
                    Connect your Solana wallet to proceed with Pass minting
                  </p>
                  <ConnectButton />
                </div>
              ) : (
                <button
                  onClick={handleMint}
                  disabled={!ready || loading || soldOut || !!mintBlocked}
                  className="w-full py-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  {!ready ? (
                    <span>Preparing wallet...</span>
                  ) : loading ? (
                    <span>Minting on Solana...</span>
                  ) : mintBlocked ? (
                    <span>Mint Not Ready</span>
                  ) : soldOut ? (
                    <span>Sold Out ({maxSupply}/{maxSupply})</span>
                  ) : (
                    <span>{mintButtonLabel}</span>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-white/40 pt-2 border-t border-white/5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Metaplex Core standard
              </span>
              <span>Press [ESC] to return to 3D world</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
