import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProjectConfig, fetchStatsCache } from "../lib/supabase";
import { fetchMintedSupply } from "../lib/passes.js";
import { lamportsToSol, solscanAccount } from "../lib/solana";
import { ProjectCarousel } from "../components/ui/ProjectCarousel.jsx";
import { EarningsCalculator } from "../components/ui/EarningsCalculator.jsx";
import { NormieFaq } from "../components/ui/NormieFaq.jsx";
import { brandConfig } from "../config/brandConfig.js";

export function HomePage() {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [minted, setMinted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchProjectConfig(), fetchStatsCache()])
      .then(async ([cfg, st]) => {
        setConfig(cfg);
        setStats(st);
        setMinted(await fetchMintedSupply(cfg));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const maxSupply = config?.max_supply ?? 2222;
  const remaining = Math.max(0, maxSupply - minted);
  const treasury = config?.treasury_wallet;
  const treasuryReady = treasury && !treasury.includes("PLACEHOLDER");

  return (
    <div className="space-y-0">
      {error && (
        <p className="mb-8 text-sm text-red-400/70 font-mono border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* ═══ SECTION 0: HERO (Shader.se Editorial) ═══ */}
      <section
        data-section="0"
        className="flex flex-col justify-center min-h-[90vh] pb-20"
      >
        <div className="max-w-4xl space-y-8 animate-fade-in-up">
          <h1 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] font-bold text-white leading-[1.05] tracking-tight">
            A Creative Development{" "}
            <br className="hidden sm:block" />
            Protocol,{" "}
            <em className="italic text-white/70">Plugged into the Future</em>
          </h1>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/office"
              className="inline-flex items-center gap-2.5 rounded-none border border-white bg-white px-7 py-3.5 font-serif text-sm font-semibold text-black hover:bg-white/90 transition-all shadow-xl"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Explore 3D Studio (WebGL)</span>
            </Link>
            <Link
              to="/mint"
              className="inline-flex items-center gap-2 rounded-none border border-white/30 px-7 py-3.5 font-serif text-sm font-medium text-white hover:border-white hover:bg-white/5 transition-all"
            >
              <span>Mint Pass</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-auto pt-20">
          <button
            onClick={() => {
              const el = document.getElementById("selected-work");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-3 text-white/30 hover:text-white/60 transition-colors font-mono text-xs tracking-widest uppercase"
          >
            <span>Scroll to Inspect Our Closed Deals</span>
            <span className="animate-bounce">↓</span>
          </button>
        </div>
      </section>

      {/* ═══ SECTION 1: SELECTED WORK ═══ */}
      <section id="selected-work" data-section="1" className="py-20">
        <ProjectCarousel />
      </section>

      {/* ═══ SECTION 2: ABOUT / PROTOCOL INFO (Editorial Two-Column) ═══ */}
      <section data-section="2" className="py-20 border-t border-white/[0.08]">
        <div className="space-y-16">
          {/* Section header */}
          <div className="space-y-6">
            <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
              About Oppos Protocol
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] max-w-3xl">
              Making Digital Revenue Sharing More Playful, Powerful, and Alive
            </h2>
          </div>

          {/* Two-column editorial text */}
          <div className="grid gap-12 lg:grid-cols-2 text-sm sm:text-base text-white/50 leading-relaxed">
            <div className="space-y-6">
              <p>
                Oppos is a creative protocol studio specialized in building interactive 3D and automated revenue solutions for Solana. Serious about business, based on-chain, and working with holders and creators worldwide.
              </p>
              <p>
                Plugged into the future. While we're a dedicated core engineering team, we have a hand-picked network of collaborators: 3D artists, WebGL shader developers, smart contract architects, and quantitative indexers.
              </p>
            </div>
            <div className="space-y-6">
              <p>
                This modular approach means we scale and adapt to every market challenge. Whether it's high-speed DAS indexing, pump.fun creator fee sweeping, or 3D WebGL configurators, we build platforms that demand attention and reward curiosity.
              </p>
              <p className="text-white/80 font-medium">
                50% to Pass holders · 20% to core dev · 30% for high-speed infrastructure. Designed split — payout job not live yet.
              </p>
            </div>
          </div>

          {/* CTA */}
          <Link
            to="/mint"
            className="btn-primary inline-flex mt-4"
          >
            <span>Mint Your Pass Today</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* ═══ SECTION 3: LIVE STATS + CALCULATOR + FAQ ═══ */}
      <section data-section="3" className="py-20 border-t border-white/[0.08] space-y-20">
        {/* Stats Grid */}
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-5">
          <StatItem
            label="Total Supply"
            value={loading ? "—" : `${minted} / ${maxSupply}`}
          />
          <StatItem
            label="Available"
            value={loading ? "—" : remaining.toLocaleString()}
          />
          <StatItem
            label="7-Day Rewards"
            value={
              loading
                ? "—"
                : stats
                  ? `${lamportsToSol(stats.trailing_holder_lamports_7d)} SOL`
                  : "0 SOL"
            }
          />
          <StatItem
            label="Treasury"
            value={
              loading
                ? "—"
                : treasuryReady
                  ? `${treasury.slice(0, 4)}…${treasury.slice(-4)}`
                  : "Pending"
            }
            href={treasuryReady ? solscanAccount(treasury) : undefined}
          />
          <StatItem
            label="Contract Address"
            value={brandConfig.meta.contractAddress}
          />
        </div>

        {/* Earnings Calculator */}
        <EarningsCalculator />

        {/* FAQ */}
        <NormieFaq />
      </section>
    </div>
  );
}

function StatItem({ label, value, href }) {
  const content = (
    <div className="py-8 px-2 border-b border-white/[0.08] sm:border-b-0 sm:border-r sm:border-white/[0.08] last:border-0">
      <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-3">
        {label}
      </p>
      <p className="font-serif text-xl sm:text-2xl font-bold text-white tabular-nums">
        {value}
      </p>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="group hover:bg-white/[0.02] transition-colors">
        {content}
      </a>
    );
  }

  return content;
}
