import { brandConfig } from "../../config/brandConfig.js";

export function PassPreviewCard({ serial = "0001", className = "" }) {
  const art = brandConfig.mint?.artPath ?? "/NFT.png";

  return (
    <div
      className={`group relative aspect-square w-full overflow-hidden border border-white/10 bg-black transition-all duration-500 hover:border-white/25 ${className}`}
    >
      <img
        src={art}
        alt={`OPPOS Pass #${serial}`}
        className="absolute inset-0 h-full w-full object-contain"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
          Metaplex Core
        </span>
        <span className="font-mono text-xs text-white/80">#{serial}</span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/75 p-4">
        <p className="font-serif text-sm font-bold tracking-tight text-white">OPPOS PASS</p>
        <p className="mt-0.5 font-mono text-[10px] text-white/50">2,222 max · 50% Pass holder split</p>
      </div>
    </div>
  );
}
