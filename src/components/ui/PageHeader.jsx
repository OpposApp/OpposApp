export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="animate-fade-in space-y-4 pb-12 border-b border-white/[0.08]">
      {eyebrow && (
        <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
          {eyebrow}
        </p>
      )}
      <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-white/40">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
