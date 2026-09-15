import { useOfficeStore, officeStore } from "../../../context/useOfficeStore";
import { brandConfig } from "../../../config/brandConfig";
import { ZapOff, RefreshCw } from "lucide-react";

export function EasterEggOverlay() {
  const isPowerOff = useOfficeStore((s) => s.isPowerOff);

  if (!isPowerOff) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-between p-8 border-4 border-red-500/30 bg-red-950/20 backdrop-filter">
      {/* Top Banner Alert */}
      <div className="flex items-center gap-3 rounded-full bg-red-500/20 border border-red-500/40 px-5 py-2 text-red-400 font-mono text-xs tracking-widest uppercase animate-pulse shadow-lg">
        <ZapOff className="h-4 w-4" />
        <span>{brandConfig.content.easterEgg.blackoutWarning}</span>
      </div>

      {/* Floating Instruction */}
      <div className="pointer-events-auto rounded-lg bg-black/90 border border-red-500/40 p-4 text-center text-xs font-mono text-white max-w-sm backdrop-blur">
        <p className="text-red-400 font-bold mb-1">CIRCUIT BREAKER DISCONNECTED</p>
        <p className="text-white/60 mb-3">
          The studio power grid was cut. Look at the wall power plug and press [E] to restore power.
        </p>
        <button
          onClick={() => officeStore.togglePower()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset Breaker Now</span>
        </button>
      </div>

      <div />
    </div>
  );
}
