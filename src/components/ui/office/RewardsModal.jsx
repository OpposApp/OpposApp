import { useEffect, useState } from "react";
import { fetchDistributions, fetchProjectConfig } from "../../../lib/supabase";
import { lamportsToSol, solscanTx } from "../../../lib/solana";
import { SplitChart } from "../SplitChart.jsx";
import { EarningsCalculator } from "../EarningsCalculator.jsx";
import { StatusBadge } from "../StatusBadge.jsx";
import { officeStore } from "../../../context/useOfficeStore";
import { X, Coins, ExternalLink, ShieldCheck } from "lucide-react";
import { PAYOUT_LABEL } from "../../../lib/rewardsConfig.js";

export function RewardsModal() {
  const [config, setConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    Promise.all([fetchProjectConfig(), fetchDistributions()])
      .then(([cfg, dist]) => {
        if (cancelled) return;
        setConfig(cfg);
        setRows(dist);
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

  const split = config
    ? {
        holder: config.holder_bps / 100,
        dev: config.dev_bps / 100,
        ops: config.ops_bps / 100,
      }
    : { holder: 50, dev: 20, ops: 30 };

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-5xl rounded-2xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold tracking-tight">Holder Revenue & Rewards</h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                  {PAYOUT_LABEL.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {split.holder}% Pass holder split designed · payout job not live yet
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

        <div className="mt-8 space-y-8">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5">
              <SplitChart holder={split.holder} dev={split.dev} ops={split.ops} />
            </div>
            <div className="lg:col-span-7">
              <EarningsCalculator />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-white">Recent Distributions</h3>
              <span className="font-mono text-xs text-white/40">On-chain payout history</span>
            </div>

            {loading ? (
              <p className="font-mono text-xs text-white/40 py-4">Fetching on-chain distribution history...</p>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs font-mono text-white/40">
                No distributions yet. The payout job is not live — this list fills when 00/06/12/18 UTC cycles start sending SOL.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/5 text-white/40 border-b border-white/10">
                    <tr>
                      <th className="p-3">Cycle</th>
                      <th className="p-3">Total Fees</th>
                      <th className="p-3">Holder Pool</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Tx</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((row) => {
                      const week =
                        row.snapshots?.week_label ??
                        new Date(row.period_end).toLocaleDateString();
                      return (
                        <tr key={row.id} className="hover:bg-white/[0.02]">
                          <td className="p-3 text-white/70">{week}</td>
                          <td className="p-3 text-white/60">{lamportsToSol(row.fees_in_lamports)} SOL</td>
                          <td className="p-3 font-bold text-emerald-400">
                            {lamportsToSol(row.holder_lamports)} SOL
                          </td>
                          <td className="p-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="p-3">
                            {row.tx_holder ? (
                              <a
                                href={solscanTx(row.tx_holder)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-400 hover:underline flex items-center gap-1"
                              >
                                <span>View</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> On-chain Solana mint via Metaplex Core
          </span>
          <span>Press [ESC] to return to 3D world</span>
        </div>
      </div>
    </div>
  );
}
