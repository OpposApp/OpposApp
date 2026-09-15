import { useEffect, useState } from "react";
import { fetchProjectConfig } from "../../../lib/supabase";
import { buildDocLinks } from "../../../lib/docLinks.js";
import { officeStore } from "../../../context/useOfficeStore";
import { X, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";
import { DISTRIBUTION_INTERVAL_HOURS, PAYOUT_SCHEDULE_UTC } from "../../../lib/rewardsConfig.js";
import { DEFAULT_BURN_DISPLAY, DEFAULT_MINT_SOL_DISPLAY } from "../../../lib/mintConfig.js";

const sections = [
  {
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
    title: "SOL Revenue Distribution",
    eyebrow: `${DISTRIBUTION_INTERVAL_HOURS}-Hour Automated Payouts`,
    intro: `Designed cadence: Pass holders are indexed every ${DISTRIBUTION_INTERVAL_HOURS} hours, splitting creator fees:`,
    items: [
      "50% → Pass Holders (SOL airdropped directly, 1 Pass = 1 Share)",
      "20% → Developer & Core Team",
      "30% → Operations, High-Speed RPC, and Database Infrastructure",
      `Payout clock: ${PAYOUT_SCHEDULE_UTC} — no manual claim required`,
    ],
    note: "* Designed split. Yield depends on trading volume, not a fixed APY. The automated payout job is not live yet.",
  },
  {
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
                  v2.4 SPEC
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Architecture, Smart Contract Mechanics, and Tokenomics
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

        {/* Documentation Sections */}
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map(({ title, eyebrow, intro, items, note }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3.5 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <h3 className="font-serif text-base font-bold text-white">{title}</h3>
                  <span className="font-mono text-[10px] text-sky-400 uppercase tracking-widest">{eyebrow}</span>
                </div>
                {intro && <p className="text-xs text-white/50 leading-relaxed font-mono">{intro}</p>}
                <ul className="space-y-2 text-xs text-white/70">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-mono text-[11px] mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {note && <p className="text-[11px] text-white/30 font-mono italic pt-1">{note}</p>}
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <h4 className="font-serif text-sm font-bold text-white">Verified Protocol Links</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {links.map((link) => {
                const cardClass =
                  "rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all block";
                const body = (
                  <>
                    <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                      <span>{link.label}</span>
                      {link.href ? (
                        <ExternalLink className="h-3 w-3 text-white/40" />
                      ) : (
                        <span className="font-mono text-[10px] text-amber-400">{link.value}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/40 font-mono">{link.desc}</p>
                  </>
                );
                if (!link.href) {
                  return (
                    <div key={link.label} className={cardClass}>
                      {body}
                    </div>
                  );
                }
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cardClass}
                  >
                    {body}
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
