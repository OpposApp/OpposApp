import { useState, useEffect, useCallback, useRef } from "react";

const ZOOM_MS = 1100;
const FADE_MS = 1400;

export function LoadingScreen({ onComplete, onReveal }) {
  const videoRef = useRef(null);
  const finishedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("play");

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onReveal?.();
    setPhase("zoom");
    window.setTimeout(() => {
      setPhase("fade");
      window.setTimeout(() => onComplete?.(), FADE_MS);
    }, ZOOM_MS);
  }, [onComplete, onReveal]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let shown = 0;
    let raf = 0;

    const tick = () => {
      const duration = video.duration;
      const target =
        duration && !Number.isNaN(duration)
          ? Math.min(99, (video.currentTime / duration) * 100)
          : shown;
      shown += (target - shown) * 0.16;
      if (target - shown < 0.08) shown = target;
      setProgress(shown);
      raf = window.requestAnimationFrame(tick);
    };

    const onEnded = () => {
      window.cancelAnimationFrame(raf);
      setProgress(100);
      finish();
    };

    raf = window.requestAnimationFrame(tick);
    video.addEventListener("ended", onEnded);
    return () => {
      window.cancelAnimationFrame(raf);
      video.removeEventListener("ended", onEnded);
    };
  }, [finish]);

  useEffect(() => {
    const fallback = window.setTimeout(() => finish(), 14000);
    return () => window.clearTimeout(fallback);
  }, [finish]);

  const leaving = phase === "zoom" || phase === "fade";

  return (
    <div
      className={`fixed inset-0 z-[60] overflow-hidden bg-black select-none ${
        phase === "fade" ? "pointer-events-none" : "pointer-events-auto"
      }`}
      style={{
        opacity: phase === "fade" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          src="/LD.mp4"
          className="h-full w-full object-contain will-change-transform"
          style={{
            transform: leaving ? "scale(18)" : "scale(1)",
            transformOrigin: "50% 46%",
            transition: `transform ${ZOOM_MS}ms cubic-bezier(0.76, 0, 1, 1)`,
            filter: phase === "fade" ? "brightness(0)" : "brightness(1)",
          }}
          autoPlay
          muted
          playsInline
          preload="auto"
          onError={finish}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-black"
        style={{
          opacity: phase === "play" ? 0 : phase === "zoom" ? 0.35 : 1,
          transition: phase === "zoom"
            ? `opacity ${ZOOM_MS}ms ease-in`
            : `opacity ${FADE_MS}ms ease-out`,
        }}
      />

      <div
        className={`absolute inset-x-0 top-0 z-10 transition-opacity duration-300 ${
          phase === "play" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-[1px] bg-white/60"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-8 pb-8 sm:px-12 sm:pb-12 transition-opacity duration-300 ${
          phase === "play" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="space-y-1">
          <p className="font-serif text-sm sm:text-base text-white/80 tracking-widest uppercase">
            Oppos
          </p>
          <p className="font-mono text-[10px] sm:text-xs text-white/30 tracking-wider">
            Creative Protocol Studio
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-[14vw] sm:text-[8vw] leading-none font-bold text-white tabular-nums">
            {String(Math.round(progress)).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
