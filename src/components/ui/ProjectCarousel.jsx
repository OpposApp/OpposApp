import { useState } from "react";
import { getMintCostLabels } from "../../lib/mintConfig.js";

const { priceSummary, burnDisplay } = getMintCostLabels(null);

const projects = [
  {
    id: "oppos-pass-0001",
    title: "OPPOS PASS #0001",
    subtitle: "Metaplex Core 3D NFT",
    description:
      "Our flagship revenue-sharing Pass NFT built on Solana Metaplex Core standard. 1 Pass = 1 Equal Share of 50% creator trading fees generated on pump.fun.",
    stats: { supply: "2,222 Max", price: priceSummary },
  },
  {
    id: "treasury-indexer",
    title: "On-Chain Fee Indexer",
    subtitle: "Helius DAS & Supabase",
    description:
      "Mint indexer writes Passes to Supabase. Holder snapshots on a 6-hour clock are designed; the payout job is not live yet.",
    stats: { payout: "6h SOL", source: "On-chain" },
  },
  {
    id: "pump-fun-integration",
    title: "$OPPOS pump.fun Pool",
    subtitle: "Tokenomics & Liquidity",
    description:
      "Direct integration with pump.fun bonding curve and Raydium. Creator fees are routed to the treasury for the Pass holder split. Payout job not live yet.",
    stats: { burn: `${burnDisplay} $OPPOS`, feeShare: "50% Pool" },
  },
  {
    id: "holder-portal",
    title: "Holder Revenue Portal",
    subtitle: "3D DApp Interface",
    description:
      "A studio-grade WebGL interface for Pass holders to estimate SOL yield and inspect distribution history once payouts go live.",
    stats: { frequency: "Every 6h", token: "Native SOL" },
  },
];

export function ProjectCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = projects[activeIdx];

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % projects.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + projects.length) % projects.length);
  };

  return (
    <div className="space-y-10">
      {/* Header Row */}
      <div className="flex items-end justify-between border-b border-white/[0.08] pb-6">
        <div className="space-y-2">
          <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
            Selected Work
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl text-white font-bold">
            Protocol Portfolio
          </h3>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-white/30 tabular-nums">
            {String(activeIdx + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center justify-center h-10 w-10 rounded-full border border-white/15 text-white/50 hover:text-white hover:border-white/40 transition-all"
              aria-label="Previous project"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center h-10 w-10 rounded-full border border-white/15 text-white/50 hover:text-white hover:border-white/40 transition-all"
              aria-label="Next project"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide */}
      <div className="relative min-h-[340px] sm:min-h-[400px] flex flex-col justify-between transition-all duration-500">
        {/* Project Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
              {active.subtitle}
            </p>
            <h4 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight">
              {active.title}
            </h4>
          </div>

          <p className="max-w-2xl text-sm sm:text-base text-white/40 leading-relaxed">
            {active.description}
          </p>
        </div>

        {/* Bottom Stats Row */}
        <div className="flex flex-wrap gap-8 mt-12 pt-6 border-t border-white/[0.08]">
          {Object.entries(active.stats).map(([k, v]) => (
            <div key={k}>
              <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-1">
                {k}
              </p>
              <p className="font-serif text-sm font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
