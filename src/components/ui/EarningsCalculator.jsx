import { useState } from "react";
import {
  DISTRIBUTION_INTERVAL_HOURS,
  HOLDER_SPLIT_PERCENT,
  PAYOUT_SHORT,
  estimateIntervalUsd,
} from "../../lib/rewardsConfig.js";

export function EarningsCalculator() {
  const [dailyVolume, setDailyVolume] = useState(50000);
  const [passesHeld, setPassesHeld] = useState(1);
  const [solPrice, setSolPrice] = useState(150);

  const dailyCreatorFeesUsd = dailyVolume * 0.01;
  const holderShareUsd = dailyCreatorFeesUsd * (HOLDER_SPLIT_PERCENT / 100);
  const totalPasses = 2222;
  const perPassDailyUsd = holderShareUsd / totalPasses;
  const myDailyUsd = perPassDailyUsd * passesHeld;
  const myIntervalUsd = estimateIntervalUsd(perPassDailyUsd, passesHeld);
  const myIntervalSol = myIntervalUsd / solPrice;
  const myMonthlyUsd = myDailyUsd * 30;

  return (
    <div className="border-t border-white/[0.08] pt-12 space-y-10">
      <div className="space-y-3">
        <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
          Earnings Estimator
        </p>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Estimate Your SOL Yield
        </h3>
        <p className="text-sm text-white/35 max-w-xl">
          Pass holders are designed to receive {HOLDER_SPLIT_PERCENT}% of creator trading fees in SOL {PAYOUT_SHORT}.
          Estimate below is fully diluted across the 2,222 max supply. The payout job is not live yet.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-white/40 font-mono">Daily Volume</span>
              <span className="font-mono font-bold text-white">
                ${dailyVolume.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={500000}
              step={5000}
              value={dailyVolume}
              onChange={(e) => setDailyVolume(Number(e.target.value))}
              className="h-[2px] w-full cursor-pointer appearance-none bg-white/15 accent-white"
            />
            <div className="flex justify-between text-[10px] text-white/20 font-mono">
              <span>$10k</span>
              <span>$500k</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-white/40 font-mono">Passes Owned</span>
              <span className="font-mono font-bold text-white">
                {passesHeld}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={passesHeld}
              onChange={(e) => setPassesHeld(Number(e.target.value))}
              className="h-[2px] w-full cursor-pointer appearance-none bg-white/15 accent-white"
            />
            <div className="flex justify-between text-[10px] text-white/20 font-mono">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <div>
            <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-2">
              Est. per {DISTRIBUTION_INTERVAL_HOURS}h Payout
            </p>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-white tabular-nums">
              ~{myIntervalSol.toFixed(4)} <span className="text-white/50 text-2xl">SOL</span>
            </p>
            <p className="mt-1 text-xs text-white/25 font-mono">
              ≈ ${myIntervalUsd.toFixed(2)} USD · ~${myMonthlyUsd.toFixed(0)}/mo at this volume
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.08]">
            <div>
              <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">Daily Pool</p>
              <p className="font-serif text-sm font-bold text-white">${holderShareUsd.toFixed(0)}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">Per Pass / Day</p>
              <p className="font-serif text-sm font-bold text-white">
                ${perPassDailyUsd.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">Frequency</p>
              <p className="font-serif text-sm font-bold text-white">Every {DISTRIBUTION_INTERVAL_HOURS}h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
