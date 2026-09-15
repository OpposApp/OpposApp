const GRADES = [
  "from-[#5c3a12] via-[#1a1208] to-black",
  "from-[#1d3d38] via-[#0b1614] to-black",
  "from-[#3a1848] via-[#140818] to-black",
  "from-[#3d1a1a] via-[#140808] to-black",
  "from-[#16344a] via-[#081018] to-black",
  "from-[#3d3110] via-[#141008] to-black",
];

function Sprockets({ count = 9 }) {
  return (
    <div className="hidden w-5 shrink-0 flex-col justify-between py-3 sm:flex" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="mx-auto h-2.5 w-2.5 rounded-[2px] bg-black ring-1 ring-white/20" />
      ))}
    </div>
  );
}

export function LaunchContactSheet({ projects }) {
  return (
    <div className="overflow-hidden bg-[#111] ring-1 ring-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
        <span>OPPOS · Contact sheet</span>
        <span>{projects.length} frames</span>
      </div>
      <div className="flex">
        <Sprockets />
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 p-2 sm:grid-cols-2 md:grid-cols-3">
          {projects.map((project, index) => (
            <figure key={project.id} className="bg-black p-[5px]">
              <div
                className={`relative flex min-h-[168px] flex-col justify-end bg-gradient-to-br ${GRADES[index % GRADES.length]} px-3 pb-3 pt-8`}
              >
                <span className="absolute left-2.5 top-2 font-mono text-[10px] text-white/55">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="absolute right-2.5 top-2 font-mono text-[10px] uppercase tracking-wider text-amber-200/80">
                  {project.revenue}
                </span>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{project.date}</p>
                <h4 className="mt-1 font-serif text-[15px] font-bold leading-snug text-white">{project.name}</h4>
              </div>
              <figcaption className="px-1.5 py-2">
                <p className="text-[11px] leading-relaxed text-white/55">{project.description}</p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-white/30">{project.category}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <Sprockets />
      </div>
    </div>
  );
}
