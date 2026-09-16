import { useEffect, useMemo, useState } from "react";
import { fetchProjectConfig } from "../../../lib/supabase";
import { fetchSolBalanceLamports, lamportsToSol, solscanAccount } from "../../../lib/solana";
import { isDevnetRpc } from "../../../lib/env.js";
import {
  HOLDER_SPLIT_PERCENT,
  PAYOUT_LABEL,
  PAYOUT_SCHEDULE_UTC,
  formatDurationHms,
  formatUtcHm,
  getNextPayoutDate,
  getUpcomingPayoutDates,
  isTokenLive,
} from "../../../lib/rewardsConfig.js";
import { officeStore } from "../../../context/useOfficeStore";
import { X, Landmark, Copy, Check, ExternalLink, Timer, Wallet, ShieldCheck } from "lucide-react";

function isPlaceholderWallet(value) {
  if (!value) return true;
  const s = String(value);
  return s.includes("PLACEHOLDER") || s.includes("YOUR_");
}

export function TreasuryModal() {
  const [now, setNow] = useState(() => new Date());
  const [config, setConfig] = useState(null);
  const [balanceLamports, setBalanceLamports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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
    if (!isTokenLive()) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchProjectConfig()
      .then(async (cfg) => {
        if (cancelled) return;
        setConfig(cfg);
        const wallet = cfg?.treasury_wallet;
        if (isPlaceholderWallet(wallet)) {
          setBalanceLamports(null);
          return;
        }
        const lamports = await fetchSolBalanceLamports(wallet);
        if (!cancelled) setBalanceLamports(lamports);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tokenLive = isTokenLive();
  const nextPayout = useMemo(() => (tokenLive ? getNextPayoutDate(now) : null), [now, tokenLive]);
  const upcomingMarks = useMemo(
    () => (tokenLive ? getUpcomingPayoutDates(4, now) : []),
    [now, tokenLive],
  );
  const remainingMs = nextPayout ? Math.max(0, nextPayout.getTime() - now.getTime()) : 0;
  const treasury = config?.treasury_wallet;
  const treasuryReady = !isPlaceholderWallet(treasury);

  async function copyWallet() {
    if (!treasuryReady) return;
    try {
      await navigator.clipboard.writeText(treasury);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold tracking-tight">Treasury Vault</h2>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-mono text-amber-400">
                  {isDevnetRpc ? "DEVNET" : "MAINNET"}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                On-chain vault · {PAYOUT_LABEL} · {HOLDER_SPLIT_PERCENT}% to Pass holders
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

        {error && (
          <p className="mt-4 text-xs text-red-400/80 font-mono border border-red-500/20 bg-red-500/5 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-400/80">
              <Timer className="h-3.5 w-3.5" />
              {tokenLive ? "Next scheduled slot" : "Awaiting token live"}
            </div>
            <p className="mt-3 font-mono text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">
              {tokenLive ? formatDurationHms(remainingMs) : "--:--:--"}
            </p>
            <p className="mt-2 text-xs text-white/50">
              {tokenLive ? (
                <>
                  Schedule mark <span className="text-amber-300 font-mono">{formatUtcHm(nextPayout)}</span>
                </>
              ) : (
                <>6-hour clock starts when $OPPOS is live</>
              )}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-1.5">
              {upcomingMarks.map((mark, index) => {
                const active = index === 0;
                return (
                  <div
                    key={mark.toISOString()}
                    className={`rounded-lg border px-1.5 py-1.5 text-center font-mono text-[10px] ${
                      active
                        ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                        : "border-white/10 bg-white/[0.03] text-white/35"
                    }`}
                  >
                    {String(mark.getUTCHours()).padStart(2, "0")}:
                    {String(mark.getUTCMinutes()).padStart(2, "0")}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] font-mono text-white/30">{PAYOUT_SCHEDULE_UTC}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/45">
              <Wallet className="h-3.5 w-3.5" />
              Vault balance
            </div>
            <p className="mt-3 font-mono text-4xl sm:text-5xl font-bold tracking-tight text-emerald-400 tabular-nums">
              {loading || balanceLamports == null ? "—" : lamportsToSol(balanceLamports)}
            </p>
            <p className="mt-2 text-xs text-white/50">SOL in treasury wallet</p>
            <p className="mt-4 text-[11px] leading-relaxed text-white/40">
              {HOLDER_SPLIT_PERCENT}% of creator fees is reserved for Pass holders each cycle.{" "}
              {tokenLive
                ? "The payout job is not live yet — this clock counts 6-hour marks from token live."
                : "Countdown starts when $OPPOS goes live on pump.fun."}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/45">Treasury wallet</p>
            {treasuryReady && (
              <a
                href={solscanAccount(treasury)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:underline"
              >
                Solscan
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <p className="mt-3 break-all font-mono text-xs sm:text-sm text-white/80">
            {loading ? "Fetching vault address…" : treasuryReady ? treasury : "Treasury wallet not configured"}
          </p>
          <button
            type="button"
            onClick={copyWallet}
            disabled={!treasuryReady}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> Public Solana vault
          </span>
          <span>Press [ESC] to return to 3D world</span>
        </div>
      </div>
    </div>
  );
}
