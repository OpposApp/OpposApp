import { Skeleton } from "./Skeleton.jsx";

export function StatCard({ label, value, sub, loading, href }) {
  const inner = (
    <>
      <p className="stat-label">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="stat-value">{value}</p>
      )}
      {sub && !loading && <p className="mt-1 text-xs text-white/25 font-mono">{sub}</p>}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block py-6 px-2 border-b border-white/[0.08] hover:bg-white/[0.02] transition-colors animate-fade-in"
      >
        {inner}
      </a>
    );
  }

  return <div className="py-6 px-2 border-b border-white/[0.08] animate-fade-in">{inner}</div>;
}
