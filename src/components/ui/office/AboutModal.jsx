import { useEffect } from "react";
import { NormieFaq } from "../NormieFaq.jsx";
import { brandConfig } from "../../../config/brandConfig";
import { officeStore } from "../../../context/useOfficeStore";
import { StickyNoteBoard } from "./StickyNote.jsx";
import { X, Info, Globe } from "lucide-react";

export function AboutModal() {
  const board = brandConfig.content.projectBoard;

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
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold tracking-tight">About OPPOS Studio</h2>
                <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-mono text-purple-400">
                  CREATIVE PROTOCOL
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Creative Development Protocol Plugged into the Future · Solana
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

        {/* Content */}
        <div className="mt-8 space-y-8">
          {/* Mission & Story */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-white">The Vision</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              OPPOS is an independent creative development protocol and studio operating directly on-chain. We build cutting-edge WebGL interactive 3D experiences, decentralized arbitrage solutions, and smart contracts on Solana.
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              OPPOS is built around a transparent revenue-sharing model: <strong>50% of $OPPOS creator fees are designed to be swept and airdropped in SOL to Pass holders on a 6-hour clock.</strong> No staking. The automated payout job is not live yet.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h3 className="font-serif text-lg font-bold text-white">Launch Roadmap</h3>
              <span className="font-serif text-xs italic text-white/40">pinned to the wall</span>
            </div>
            <StickyNoteBoard projects={board.projects} />
          </div>

          {/* Interactive FAQ Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-serif text-lg font-bold text-white">Frequently Asked Questions</h3>
            <NormieFaq />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
          <span className="flex items-center gap-1.5 text-purple-400">
            <Globe className="h-4 w-4" /> Oppos Sweden AB · Operating Worldwide
          </span>
          <span>Press [ESC] to return to 3D world</span>
        </div>
      </div>
    </div>
  );
}
