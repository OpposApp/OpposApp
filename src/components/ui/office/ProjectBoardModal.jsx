import { useEffect } from "react";
import { brandConfig } from "../../../config/brandConfig";
import { officeStore } from "../../../context/useOfficeStore";
import { LaunchContactSheet } from "./LaunchContactSheet.jsx";
import { X, Map, ArrowRight } from "lucide-react";

export function ProjectBoardModal() {
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
      <div className="relative w-full max-w-3xl rounded-xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold tracking-tight">{board.title}</h2>
              <p className="text-xs text-white/50">{board.subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => officeStore.requestCloseModals()}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          <LaunchContactSheet projects={board.projects} />
        </div>

        {/* Bottom Callout */}
        <div className="mt-8 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Join the launch — mint your revenue share</p>
            <p className="text-xs text-white/50 mt-0.5">Hold an Oppos Pass for 50% of creator fees, paid in SOL every 6 hours.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              officeStore.setBoardModalOpen(false);
              officeStore.setMintModalOpen(true);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-white/90 transition-colors cursor-pointer"
          >
            <span>Mint Pass</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
