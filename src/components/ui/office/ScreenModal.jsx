import { useState, useEffect } from "react";
import { brandConfig } from "../../../config/brandConfig";
import { officeStore } from "../../../context/useOfficeStore";
import { Terminal, X, Play, ExternalLink } from "lucide-react";

export function ScreenModal() {
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const cfg = brandConfig.content.workstation;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        officeStore.requestCloseModals();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRunSim = () => {
    setRunning(true);
    setOutput("Connecting to Solana RPC node...\n[DEMO] Analyzing holder snapshot...");
    setTimeout(() => {
      setOutput((prev) => prev + "\nFound 2,222 Pass Holder Addresses.");
    }, 600);
    setTimeout(() => {
      setOutput(
        (prev) =>
          prev +
          "\n[OK] Revenue Fee Pool: 142.50 SOL\n[OK] Executing 50% split (71.25 SOL disbursed).\n[OK] Next payout cycle: 6h clock (00/06/12/18 UTC).\nAll transactions confirmed on-chain!\n\n(Simulation only — not live on-chain data)",
      );
      setRunning(false);
    }, 1400);
  };

  const handleQuickLink = (link) => {
    if (link.action === "mint") {
      officeStore.setScreenModalOpen(false);
      officeStore.setMintModalOpen(true);
      return;
    }
    if (link.action === "rewards") {
      officeStore.setScreenModalOpen(false);
      officeStore.setRewardsModalOpen(true);
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/15 bg-zinc-950 p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold tracking-wide">{cfg.title}</h3>
              <p className="font-mono text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {cfg.systemStatus} · {cfg.uptime}
              </p>
            </div>
          </div>

          <button
            onClick={() => officeStore.requestCloseModals()}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-white/10 bg-black/80 p-4 font-mono text-xs overflow-x-auto text-sky-300 max-h-56 leading-relaxed">
            <pre>{cfg.codeSnippet}</pre>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleRunSim}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {running ? "Simulating Pipeline..." : "Execute Revenue Simulation"}
            </button>

            <span className="font-mono text-[11px] text-white/40">Press ESC to exit modal</span>
          </div>

          {output && (
            <div className="rounded-lg bg-zinc-900/90 border border-emerald-500/30 p-3 font-mono text-xs text-emerald-300 whitespace-pre-line animate-fade-in">
              {output}
            </div>
          )}

          <div className="border-t border-white/10 pt-4 flex flex-wrap gap-2">
            {cfg.quickLinks.map((link) =>
              link.external || link.url?.startsWith("http") ? (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-md border border-white/5 hover:border-white/20 transition-all"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              ) : (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handleQuickLink(link)}
                  className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-md border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                >
                  {link.label}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
