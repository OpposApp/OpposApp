export function SupplyProgress({ minted, current, max = 2222, className = "" }) {
  const actualMinted = minted ?? current ?? 0;
  const actualMax = max ?? 2222;
  const pct = actualMax > 0 ? Math.min(100, (actualMinted / actualMax) * 100) : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest">Supply</p>
          <p className="mt-1 font-serif text-xl font-bold text-white tabular-nums">
            {actualMinted.toLocaleString()} <span className="text-white/30">/ {actualMax.toLocaleString()}</span>
          </p>
        </div>
        <p className="font-mono text-xs text-white/40 tabular-nums">{pct.toFixed(1)}%</p>
      </div>
      <div className="h-[2px] overflow-hidden bg-white/10">
        <div
          className="h-full bg-white/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
