import { useEffect, useState } from "react";
import { fetchProjectConfig } from "../../../lib/supabase";
import { buildDocLinks } from "../../../lib/docLinks.js";
import { officeStore } from "../../../context/useOfficeStore";
import { X, BookOpen, ShieldCheck } from "lucide-react";
import { DISTRIBUTION_INTERVAL_HOURS, PAYOUT_SCHEDULE_UTC } from "../../../lib/rewardsConfig.js";
import { DEFAULT_BURN_DISPLAY, DEFAULT_MINT_SOL_DISPLAY } from "../../../lib/mintConfig.js";

const SHEETS = [
  {
    plate: "A1",
    variant: "linen",
    title: "Pass NFT Mint Rules",
    eyebrow: "Phase 1 Mechanics",
    intro: "Single atomic transaction on Solana Metaplex Core standard:",
    items: [
      `Burn ${DEFAULT_BURN_DISPLAY} $OPPOS (permanently destroyed from total supply)`,
      `Pay ${DEFAULT_MINT_SOL_DISPLAY} directly to the treasury wallet`,
      "Receive 1 Oppos Pass NFT (Strict 2,222 maximum supply)",
      "Fair launch — single edition with equal revenue share per Pass",
    ],
  },
  {
    plate: "A2",
    variant: "blueprint",
    title: "SOL Revenue Distribution",
    eyebrow: `Designed ${DISTRIBUTION_INTERVAL_HOURS}-Hour Payouts`,
    intro: `Designed cadence: Pass holders are snapshotted every ${DISTRIBUTION_INTERVAL_HOURS} hours, splitting creator fees:`,
    items: [
      "50% → Pass Holders (SOL airdropped directly, 1 Pass = 1 Share)",
      "20% → Developer & Core Team",
      "30% → Operations, High-Speed RPC, and Database Infrastructure",
      `Payout clock: ${PAYOUT_SCHEDULE_UTC} — no claim UI once the payout job is live`,
    ],
    note: "* Designed split. Yield depends on trading volume, not a fixed APY. The automated payout job is not live yet.",
  },
  {
    plate: "A3",
    variant: "graphite",
    title: "Metaplex Core Standard",
    eyebrow: "Next-Gen Asset Architecture",
    intro: "Built on Solana's lowest-overhead NFT standard:",
    items: [
      "85% cheaper mint and transfer network fees than legacy NFTs",
      "Single-account architecture eliminating token account rent overhead",
      "Native on-chain asset enforcement and verified collection tagging",
    ],
  },
];

const SHEET_THEME = {
  linen: {
    sheet: "bg-[#efe6d4] text-zinc-900",
    stamp: "text-teal-900/80",
    rule: "border-zinc-800/15",
    num: "text-teal-800",
    intro: "text-zinc-600",
    body: "text-zinc-800",
    note: "text-zinc-500",
  },
  blueprint: {
    sheet: "bg-[#163044] text-sky-50",
    stamp: "text-sky-300/90",
    rule: "border-sky-200/20",
    num: "text-sky-300",
    intro: "text-sky-100/70",
    body: "text-sky-50",
    note: "text-sky-200/55",
  },
  graphite: {
    sheet: "bg-[#e7e2d8] text-zinc-900",
    stamp: "text-indigo-900/70",
    rule: "border-zinc-800/15",
    num: "text-indigo-800",
    intro: "text-zinc-600",
    body: "text-zinc-800",
    note: "text-zinc-500",
  },
};

function CropMarks({ className = "border-current/40" }) {
  return (
    <>
      <span aria-hidden className={`pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t ${className}`} />
      <span aria-hidden className={`pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t ${className}`} />
      <span aria-hidden className={`pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l ${className}`} />
      <span aria-hidden className={`pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r ${className}`} />
    </>
  );
}

function SpecSheet({ plate, variant, title, eyebrow, intro, items, note, wide = false }) {
  const theme = SHEET_THEME[variant];
  return (
    <article
      className={`relative ${theme.sheet} px-6 pb-6 pt-5 shadow-[4px_10px_24px_rgba(0,0,0,0.28)] ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <CropMarks className={variant === "blueprint" ? "border-sky-200/40" : "border-zinc-800/35"} />
      <div className={`flex items-start justify-between gap-3 border-b pb-3 ${theme.rule}`}>
        <div>
          <p className={`font-mono text-[10px] uppercase tracking-[0.22em] ${theme.stamp}`}>{eyebrow}</p>
          <h3 className="mt-1 font-serif text-lg font-bold leading-tight">{title}</h3>
        </div>
        <span className={`shrink-0 font-mono text-[11px] ${theme.stamp}`}>PLT {plate}</span>
      </div>
      {intro && <p className={`mt-3 text-xs leading-relaxed ${theme.intro}`}>{intro}</p>}
      <ol className="mt-4 space-y-2.5">
        {items.map((item, i) => (
          <li key={item} className={`flex items-start gap-3 text-sm leading-relaxed ${theme.body}`}>
            <span className={`mt-0.5 shrink-0 font-mono text-[10px] ${theme.num}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
      {note && <p className={`mt-4 border-t pt-3 text-[11px] italic ${theme.rule} ${theme.note}`}>{note}</p>}
    </article>
  );
}

export function DocsModal() {
  const [links, setLinks] = useState(() => buildDocLinks(null));

  useEffect(() => {
    let cancelled = false;
    fetchProjectConfig()
      .then((cfg) => {
        if (!cancelled) setLinks(buildDocLinks(cfg?.treasury_wallet));
      })
      .catch(() => {
        if (!cancelled) setLinks(buildDocLinks(null));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        officeStore.requestCloseModals();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold tracking-tight">Protocol Documentation</h2>
                <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[10px] font-mono text-sky-400">
                  DOCS
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Architecture and tokenomics
              </p>
            </div>
          </div>

          <button
            onClick={() => officeStore.requestCloseModals()}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            {SHEETS.map((sheet) => (
              <SpecSheet key={sheet.plate} {...sheet} wide={sheet.variant === "graphite"} />
            ))}
          </div>

          <div className="border-t border-dashed border-white/15 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Verified protocol links</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              {links.map((link) => {
                const inner = (
                  <>
                    <span className="font-serif text-sm text-white">{link.label}</span>
                    <span className="mt-0.5 block font-mono text-[11px] text-white/40">
                      {link.href ? link.desc : link.value ?? link.desc}
                    </span>
                  </>
                );
                if (!link.href) {
                  return (
                    <div key={link.label} className="min-w-[9rem]">
                      {inner}
                    </div>
                  );
                }
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-[9rem] hover:text-sky-300"
                  >
                    {inner}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
          <span className="flex items-center gap-1.5 text-sky-400">
            <ShieldCheck className="h-4 w-4" /> Verifiable on Solana
          </span>
          <span>Press [ESC] to return to 3D world</span>
        </div>
      </div>
    </div>
  );
}
