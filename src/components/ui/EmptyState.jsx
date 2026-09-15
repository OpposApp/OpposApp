export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center border-t border-white/[0.08]">
      <h3 className="font-serif text-lg font-bold text-white">{title}</h3>
      {description && (
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/30">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
