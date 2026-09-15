export function SplitChart({ holder, dev, ops }) {
  const segments = [
    { label: "Holders", pct: holder, color: "bg-white/70" },
    { label: "Dev", pct: dev, color: "bg-white/30" },
    { label: "Ops", pct: ops, color: "bg-white/15" },
  ];

  return (
    <div className="space-y-6">
      <p className="font-serif text-xl font-bold text-white">Fee Split</p>
      <div className="flex h-[2px] overflow-hidden bg-white/5">
        {segments.map(({ label, pct, color }) => (
          <div
            key={label}
            className={`${color} transition-all`}
            style={{ width: `${pct}%` }}
            title={`${label}: ${pct}%`}
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {segments.map(({ label, pct, color }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-white/35 font-mono text-xs">{label}</span>
            <span className="ml-auto font-serif font-bold text-white tabular-nums">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
