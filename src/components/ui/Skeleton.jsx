export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse-soft bg-white/5 ${className}`}
      aria-hidden
    />
  );
}
