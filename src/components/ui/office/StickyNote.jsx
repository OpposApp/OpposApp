const PALETTES = [
  { paper: "bg-[#f6e2a8]", rotate: "-rotate-[1.8deg]", tape: "bg-[#fff4c2]/85" },
  { paper: "bg-[#f3c8c4]", rotate: "rotate-[1.5deg]", tape: "bg-white/55" },
  { paper: "bg-[#d7ead0]", rotate: "-rotate-[0.7deg]", tape: "bg-white/45" },
  { paper: "bg-[#d3e3f4]", rotate: "rotate-[2.1deg]", tape: "bg-white/50" },
  { paper: "bg-[#f4d5b0]", rotate: "-rotate-[2.4deg]", tape: "bg-[#ffe8c4]/80" },
  { paper: "bg-[#e4d0ef]", rotate: "rotate-[0.9deg]", tape: "bg-white/50" },
];

export function StickyNote({ project, index = 0 }) {
  const palette = PALETTES[index % PALETTES.length];

  return (
    <article
      className={`relative ${palette.paper} ${palette.rotate} px-4 pb-4 pt-6 text-zinc-800 shadow-[2px_8px_16px_rgba(0,0,0,0.28)] transition-transform hover:rotate-0 hover:z-10`}
    >
      <span
        aria-hidden
        className={`absolute -top-2 left-1/2 h-3.5 w-[3.25rem] -translate-x-1/2 rotate-[8deg] ${palette.tape} shadow-sm`}
      />
      <div className="flex items-baseline justify-between gap-2 font-serif text-[11px] italic text-zinc-600">
        <span>{project.date}</span>
        <span className="not-italic font-semibold text-zinc-700">{project.revenue}</span>
      </div>
      <h4 className="mt-2 font-serif text-[15px] font-bold leading-snug text-zinc-900">{project.name}</h4>
      <p className="mt-2 text-[12px] leading-relaxed text-zinc-700">{project.description}</p>
      <p className="mt-3 border-t border-zinc-800/10 pt-2 font-serif text-[11px] italic text-zinc-600">
        {project.category}
      </p>
    </article>
  );
}

export function StickyNoteBoard({ projects }) {
  return (
    <div className="rounded-md border border-black/40 bg-[#4a3424] px-5 pb-6 pt-7 sm:px-6 sm:pt-8 shadow-inner">
      <div
        className="grid gap-x-5 gap-y-7 sm:grid-cols-2 md:grid-cols-3"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.18) 0.7px, transparent 0.8px), radial-gradient(rgba(255,255,255,0.04) 0.7px, transparent 0.8px)",
          backgroundSize: "11px 11px, 17px 17px",
          backgroundPosition: "0 0, 6px 5px",
        }}
      >
        {projects.map((project, index) => (
          <StickyNote key={project.id} project={project} index={index} />
        ))}
      </div>
    </div>
  );
}
