import { useEffect, useState } from "react";
import { fetchProjectConfig } from "../lib/supabase";
import { buildDocLinks } from "../lib/docLinks.js";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { DISTRIBUTION_INTERVAL_HOURS, PAYOUT_SCHEDULE_UTC, PAYOUT_SHORT } from "../lib/rewardsConfig.js";
import { DEFAULT_BURN_DISPLAY, DEFAULT_MINT_SOL_DISPLAY } from "../lib/mintConfig.js";

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

export function DocsPage() {
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

  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Protocol Documentation"
        title="Architecture & Tokenomics"
        description={`Learn how on-chain minting, Pass indexing, and designed SOL payouts (${PAYOUT_SHORT}) operate.`}
      />

      <div className="grid gap-12 lg:grid-cols-2">
        {sections.map(({ title, eyebrow, intro, items, note }) => (
          <section key={title} className="space-y-6">
            <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-white">{title}</h2>
              <span className="font-mono text-[10px] text-white/25 uppercase tracking-widest">
                {eyebrow}
              </span>
            </div>

            {intro && <p className="text-xs leading-relaxed text-white/35 font-mono">{intro}</p>}

            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/60">
                  <span className="mt-2 flex h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {note && (
              <p className="text-[11px] text-white/20 font-mono border-t border-white/[0.08] pt-3">
                {note}
              </p>
            )}
          </section>
        ))}
      </div>

      <section className="border-t border-white/[0.08] pt-12 space-y-6">
        <h2 className="font-serif text-xl font-bold text-white">Verified Links</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {links.map(({ label, href, external, desc, value }) => {
            const cardClass =
              "group block border border-white/[0.08] p-5 hover:border-white/20 transition-all";
            const body = (
              <>
                <p className="font-serif text-sm font-bold text-white/70 group-hover:text-white transition-colors">
                  {href ? `${label} ↗` : label}
                </p>
                <p className="mt-1.5 text-xs text-white/25 font-mono">{href ? desc : value ?? desc}</p>
              </>
            );
            if (!href) {
              return (
                <div key={label} className={cardClass}>
                  {body}
                </div>
              );
            }
            return (
              <a
                key={label}
                href={href}
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                className={cardClass}
              >
                {body}
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
