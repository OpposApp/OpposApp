import { useEffect, useState } from "react";
import { fetchDistributions, fetchProjectConfig } from "../lib/supabase";
import { lamportsToSol, solscanTx } from "../lib/solana";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { SplitChart } from "../components/ui/SplitChart.jsx";
import { StatusBadge } from "../components/ui/StatusBadge.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { EarningsCalculator } from "../components/ui/EarningsCalculator.jsx";
import { PAYOUT_DESCRIPTION, PAYOUT_LABEL } from "../lib/rewardsConfig.js";

export function RewardsPage() {
  const [config, setConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchProjectConfig(), fetchDistributions()])
      .then(([cfg, dist]) => {
        setConfig(cfg);
        setRows(dist);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const split = config
    ? {
        holder: config.holder_bps / 100,
        dev: config.dev_bps / 100,
        ops: config.ops_bps / 100,
      }
    : { holder: 50, dev: 20, ops: 30 };

  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Payout Transparency"
        title={`${PAYOUT_LABEL}`}
        description={PAYOUT_DESCRIPTION}
      />

      {/* Split Chart & Calculator */}
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SplitChart holder={split.holder} dev={split.dev} ops={split.ops} />
        </div>
        <div className="lg:col-span-7">
          <EarningsCalculator />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400/70 font-mono border-t border-white/[0.08] pt-4">
          {error}
        </p>
      )}

      {loading && (
        <div className="space-y-4 border-t border-white/[0.08] pt-8">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <EmptyState
          title="No Payout History Yet"
          description={`The payout job is not live yet. History fills when 00/06/12/18 UTC cycles start sending SOL.`}
        />
      )}

      {!loading && rows.length > 0 && (
        <div className="border-t border-white/[0.08] pt-8">
          <div className="flex items-center justify-between pb-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Historical Distributions</h3>
              <p className="text-xs text-white/25 font-mono mt-1">On-chain verified SOL payouts</p>
            </div>
            <span className="font-mono text-xs text-white/30 uppercase tracking-widest">Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
              <thead className="border-b border-white/10 text-white/30 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 pr-4">Cycle</th>
                  <th className="py-3 pr-4">Total Fees</th>
                  <th className="py-3 pr-4">Holder Pool</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => {
                  const week =
                    row.snapshots?.week_label ??
                    new Date(row.period_end).toLocaleDateString();
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pr-4 font-mono font-bold text-white">{week}</td>
                      <td className="py-4 pr-4 font-mono text-white/60">
                        {lamportsToSol(row.fees_in_lamports)} SOL
                      </td>
                      <td className="py-4 pr-4 font-mono font-bold text-white">
                        {lamportsToSol(row.holder_lamports)} SOL
                      </td>
                      <td className="py-4 pr-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-4 text-right">
                        {row.tx_holder ? (
                          <a
                            href={solscanTx(row.tx_holder)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs text-white/40 hover:text-white transition-colors"
                          >
                            Solscan ↗
                          </a>
                        ) : (
                          <span className="text-white/15">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
