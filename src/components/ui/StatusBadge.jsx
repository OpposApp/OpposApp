const styles = {
  completed: "text-white/60",
  draft: "text-white/25",
  failed: "text-red-400/60",
  pending: "text-white/35",
  split_pending: "text-white/35",
};

export function StatusBadge({ status }) {
  const key = status?.toLowerCase().replace(/\s+/g, "_") ?? "draft";
  const cls = styles[key] ?? styles.draft;
  const label = status?.replace(/_/g, " ") ?? "unknown";

  return (
    <span className={`font-mono text-xs capitalize ${cls}`}>
      {label}
    </span>
  );
}
