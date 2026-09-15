import { useState } from "react";
import { DISTRIBUTION_INTERVAL_HOURS, PAYOUT_SHORT } from "../../lib/rewardsConfig.js";
import { DEFAULT_BURN_DISPLAY, DEFAULT_MINT_SOL_DISPLAY } from "../../lib/mintConfig.js";

const faqs = [
  {
    q: "What is Oppos Pass?",
    a: `Oppos Pass is an NFT on Solana (max 2,222 supply). Holding a Pass is designed to make you a revenue-share partner of $OPPOS — 50% of creator trading fees, paid in SOL. The automated payout job is not live yet.`,
  },
  {
    q: "How do I earn SOL?",
    a: `Hold an Oppos Pass in your Solana wallet. Creator fees from $OPPOS trading are designed to be swept and split ${PAYOUT_SHORT} (50% to holders). The automated payout job is not live yet.`,
  },
  {
    q: "What does 'Burn & Mint' mean?",
    a: `To mint 1 Pass, you burn ${DEFAULT_BURN_DISPLAY} $OPPOS tokens (permanently destroying them, reducing token supply forever) and pay ${DEFAULT_MINT_SOL_DISPLAY}. In return, you receive 1 Pass NFT.`,
  },
  {
    q: "Do I need to stake my Pass?",
    a: `No staking. Just hold it in Phantom, Solflare, or a connected wallet. Snapshots are designed to run every ${DISTRIBUTION_INTERVAL_HOURS} hours once the payout engine ships.`,
  },
  {
    q: "Can I sell my Pass later?",
    a: `Yes. Pass NFTs are tradeable on Tensor, Magic Eden, and other marketplaces. Whichever wallet holds the Pass at each snapshot is designed to receive that round's SOL once payouts go live.`,
  },
];

export function NormieFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="border-t border-white/[0.08] pt-12 space-y-8">
      <div className="space-y-3">
        <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
          FAQ
        </p>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Frequently Asked Questions
        </h3>
      </div>

      <div className="space-y-0">
        {faqs.map(({ q, a }, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={q}
              className="border-b border-white/[0.08] last:border-0"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between py-5 text-left font-serif text-base sm:text-lg text-white/80 hover:text-white transition-colors"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              >
                <span>{q}</span>
                <span
                  className={`ml-4 text-white/30 transition-transform duration-300 text-sm ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-96 opacity-100 pb-5" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-sm leading-relaxed text-white/35 max-w-2xl">
                  {a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
