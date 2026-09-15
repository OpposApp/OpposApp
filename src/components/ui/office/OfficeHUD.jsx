import { useEffect, useState } from "react";
import { brandConfig } from "../../../config/brandConfig";
import { useOfficeStore, officeStore } from "../../../context/useOfficeStore";
import { ConnectButton } from "../../ConnectButton.jsx";
import {
  Radio,
  Volume2,
  VolumeX,
  SkipForward,
  MousePointer,
  Play,
} from "lucide-react";

export function OfficeHUD() {
  const isLocked = useOfficeStore((s) => s.isLocked);
  const hasStarted = useOfficeStore((s) => s.hasStarted);
  const hovered = useOfficeStore((s) => s.hoveredObject);
  const isRadioPlaying = useOfficeStore((s) => s.isRadioPlaying);
  const currentStationIndex = useOfficeStore((s) => s.currentStationIndex);
  const isMintModalOpen = useOfficeStore((s) => s.isMintModalOpen);
  const isRewardsModalOpen = useOfficeStore((s) => s.isRewardsModalOpen);
  const isDocsModalOpen = useOfficeStore((s) => s.isDocsModalOpen);
  const isAboutModalOpen = useOfficeStore((s) => s.isAboutModalOpen);
  const isScreenModalOpen = useOfficeStore((s) => s.isScreenModalOpen);
  const isBoardModalOpen = useOfficeStore((s) => s.isBoardModalOpen);
  const isTreasuryModalOpen = useOfficeStore((s) => s.isTreasuryModalOpen);
  const cameraFocus = useOfficeStore((s) => s.cameraFocus);
  const doorLockedNotice = useOfficeStore((s) => s.doorLockedNotice);
  const guitarNotice = useOfficeStore((s) => s.guitarNotice);
  const isBedCutscene = useOfficeStore((s) => s.isBedCutscene);
  const [isTouchOffice, setIsTouchOffice] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setIsTouchOffice(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const activeStation = brandConfig.audio.stations[currentStationIndex];
  const anyModalOpen =
    isMintModalOpen ||
    isRewardsModalOpen ||
    isDocsModalOpen ||
    isAboutModalOpen ||
    isScreenModalOpen ||
    isBoardModalOpen ||
    isTreasuryModalOpen ||
    isBedCutscene;

  // Listen for ESC, Space, or WASD keys when paused to enter / resume exploration
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        !isLocked &&
        !anyModalOpen &&
        !cameraFocus &&
        (e.code === "Escape" ||
          e.code === "Space" ||
          e.code === "KeyW" ||
          e.code === "KeyA" ||
          e.code === "KeyS" ||
          e.code === "KeyD" ||
          e.code === "ArrowUp" ||
          e.code === "ArrowDown" ||
          e.code === "ArrowLeft" ||
          e.code === "ArrowRight")
      ) {
        if (e.code === "Space") e.preventDefault();
        officeStore.lockPointer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, anyModalOpen, cameraFocus]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* ── TOP HEADER (CLEAN BRAND CREST & WALLET) ── */}
      <header className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Brand Crest */}
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-mono backdrop-blur-md shadow-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <img
            src="/oppos-logo-sign.png"
            alt={brandConfig.meta.brandName}
            className="h-6 w-auto select-none"
          />
        </div>

        {/* Right side: Wallet + Radio Widget */}
        <div className="flex items-center gap-3">
          <ConnectButton />
          <button
            onClick={() => officeStore.toggleRadio()}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Toggle Radio"
          >
            <Radio
              className={`h-4 w-4 ${isRadioPlaying ? "text-emerald-400 animate-pulse" : "text-white/40"}`}
            />
            <span className="max-w-[120px] sm:max-w-[160px] truncate text-white">
              {activeStation?.name || "Radio"}
            </span>
          </button>

          <button
            onClick={() => officeStore.nextStation()}
            className="p-1 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/10 cursor-pointer"
            title="Next Station"
          >
            <SkipForward className="h-3 w-3" />
          </button>

          <button
            onClick={() => officeStore.toggleRadio()}
            className="p-1 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/10 cursor-pointer"
          >
            {isRadioPlaying ? (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-white/40" />
            )}
          </button>
        </div>
      </header>

      {/* ── CENTER RETICLE / CROSSHAIR (FPS AIMING CURSOR) ── */}
      {cameraFocus?.phase === "in" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="mt-24 animate-fade-in-up rounded-lg border border-white/15 bg-black/80 px-4 py-2 text-xs font-mono text-white/80 shadow-2xl backdrop-blur-md">
            {cameraFocus.interactType === "bed"
              ? "Lying down…"
              : cameraFocus.interactType === "screen" ||
                cameraFocus.interactType === "sofa" ||
                cameraFocus.interactType === "painting"
              ? "Sitting down…"
              : cameraFocus.interactType === "treasury"
              ? "Opening vault…"
              : "Moving closer…"}
          </div>
        </div>
      )}

      {cameraFocus?.phase === "hold" &&
        (cameraFocus.interactType === "sofa" || cameraFocus.interactType === "painting") && (
        <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/80 px-4 py-2 text-xs font-mono text-white/85 shadow-2xl backdrop-blur-md">
            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-sky-300 font-bold border border-sky-400/30">
              E
            </span>
            <span>Stand up</span>
          </div>
        </div>
      )}

      {!anyModalOpen && !cameraFocus && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Horizontal crosshair ticks */}
            <div
              className={`absolute h-[1px] transition-all duration-150 ${
                hovered ? "w-6 bg-sky-400/90" : "w-4 bg-white/40"
              }`}
            />
            {/* Vertical crosshair ticks */}
            <div
              className={`absolute w-[1px] transition-all duration-150 ${
                hovered ? "h-6 bg-sky-400/90" : "h-4 bg-white/40"
              }`}
            />

            {/* Outer ring */}
            <div
              className={`rounded-full border transition-all duration-200 ${
                hovered
                  ? "h-9 w-9 border-sky-400/80 bg-sky-400/15 scale-110"
                  : "h-3.5 w-3.5 border-white/60 bg-black/20 scale-100"
              }`}
            />

            {/* Center pinpoint dot */}
            <div
              className={`absolute rounded-full transition-all duration-150 ${
                hovered ? "h-2 w-2 bg-sky-300 shadow-lg shadow-sky-400" : "h-1 w-1 bg-white"
              }`}
            />
          </div>

          {/* Interactive Action Prompt Badge */}
          {hovered && (
            <div className="mt-6 animate-fade-in-up flex items-center gap-2 rounded-lg border border-sky-400/30 bg-black/85 px-4 py-2 text-xs font-mono text-white shadow-2xl backdrop-blur-md">
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-sky-300 font-bold border border-sky-400/30">
                E
              </span>
              <span>{hovered.label}</span>
            </div>
          )}

          {/* Locked door feedback */}
          {doorLockedNotice && (
            <div className="mt-4 animate-fade-in-up rounded-lg border border-amber-500/40 bg-black/90 px-5 py-2.5 text-sm font-mono font-bold tracking-wide text-amber-300 shadow-2xl backdrop-blur-md">
              ( LOCKED — SOON )
            </div>
          )}
          {guitarNotice && (
            <div className="mt-4 animate-fade-in-up rounded-lg border border-white/20 bg-black/90 px-5 py-2.5 text-sm font-serif font-bold tracking-wide text-white shadow-2xl backdrop-blur-md">
              Ain&apos;t no way you play a guitar lol
            </div>
          )}
        </div>
      )}

      {/* ── SEAMLESS INITIAL ENTRY HINT (BEFORE FIRST LOCK) ── */}
      {!hasStarted && !isLocked && !anyModalOpen && !isTouchOffice && (
        <div
          onClick={() => officeStore.lockPointer()}
          className="pointer-events-auto absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full border border-sky-400/40 bg-black/80 px-6 py-3 text-xs font-mono text-white shadow-2xl backdrop-blur-md cursor-pointer hover:bg-black/90 hover:border-sky-300 transition-all animate-bounce"
        >
          <MousePointer className="h-4 w-4 text-sky-400 animate-pulse" />
          <span>Click anywhere to lock mouse look · [W,A,S,D] to walk</span>
        </div>
      )}

      {isTouchOffice && !anyModalOpen && !cameraFocus && (
        <div className="pointer-events-auto absolute inset-x-4 bottom-20 z-40 mx-auto max-w-md rounded-xl border border-white/15 bg-black/85 p-4 text-center text-white backdrop-blur-md">
          <p className="font-serif text-sm font-bold">Desktop office</p>
          <p className="mt-1 text-xs text-white/55">
            First-person look uses a mouse. Open mint, rewards, or docs on this device.
          </p>
          <div className="mt-3 flex justify-center gap-3 text-[11px] font-mono">
            <a href="/mint" className="text-indigo-300 underline">Mint</a>
            <a href="/rewards" className="text-amber-300 underline">Rewards</a>
            <a href="/docs" className="text-sky-300 underline">Docs</a>
          </div>
        </div>
      )}

      {/* ── PAUSE OVERLAY (ONLY AFTER USER EXPLICITLY PRESSES ESC) ── */}
      {hasStarted && !isLocked && !anyModalOpen && !cameraFocus && (
        <div
          onClick={() => officeStore.lockPointer()}
          className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[3px] cursor-pointer animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center rounded-2xl border border-white/15 bg-zinc-950/95 p-8 text-center text-white shadow-2xl max-w-sm w-full mx-4 cursor-default"
          >
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
              <MousePointer className="h-6 w-6" />
            </div>

            <h2 className="font-serif text-xl font-bold tracking-wide">
              Exploration Paused
            </h2>

            <p className="mt-2 text-xs text-white/50 leading-relaxed">
              Press [ESC], Space, or click below to resume your first-person exploration.
            </p>

            {/* Action button */}
            <button
              onClick={() => officeStore.lockPointer()}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black hover:bg-white/90 font-medium py-3 text-xs tracking-wide transition-all shadow-xl cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              <span>Resume (ESC)</span>
            </button>

            {/* Cheatsheet Keybinds */}
            <div className="mt-5 flex flex-col gap-2 w-full text-left font-mono text-[11px] text-white/60 bg-white/5 p-3.5 rounded-lg border border-white/5">
              <div className="flex justify-between">
                <span>Move:</span>
                <span className="text-white">W, A, S, D</span>
              </div>
              <div className="flex justify-between">
                <span>Sprint:</span>
                <span className="text-white">Shift</span>
              </div>
              <div className="flex justify-between">
                <span>Interact:</span>
                <span className="text-white">[E] Key</span>
              </div>
              <div className="flex justify-between">
                <span>Pause / Release Mouse:</span>
                <span className="text-white">ESC</span>
              </div>
            </div>

            {/* Quick in-world portal shortcuts */}
            <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-between text-[11px] font-mono">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  officeStore.setMintModalOpen(true);
                }}
                className="text-indigo-400 hover:underline cursor-pointer"
              >
                ✦ Mint
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  officeStore.setRewardsModalOpen(true);
                }}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                ✦ Rewards
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  officeStore.setDocsModalOpen(true);
                }}
                className="text-sky-400 hover:underline cursor-pointer"
              >
                ✦ Docs
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  officeStore.setAboutModalOpen(true);
                }}
                className="text-purple-400 hover:underline cursor-pointer"
              >
                ✦ About
              </button>
            </div>

            <p className="mt-3 text-[10px] font-mono text-indigo-400 tracking-widest uppercase">
              Click anywhere outside to resume
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER CONTROLS CHEATSHEET ── */}
      <footer className="flex items-center justify-between font-mono text-[11px] text-white/40 pointer-events-auto">
        <div className="hidden md:flex items-center gap-4 bg-black/60 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
          <span>[WASD] Move</span>
          <span>•</span>
          <span>[Mouse] Look Around</span>
          <span>•</span>
          <span>[Shift] Sprint</span>
          <span>•</span>
          <span>[E] Interact</span>
          <span>•</span>
          <span>[ESC] Release Mouse / Pause</span>
        </div>
      </footer>
    </div>
  );
}
