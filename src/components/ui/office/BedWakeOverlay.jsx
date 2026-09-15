import { useEffect, useState } from "react";
import { officeStore, useOfficeStore } from "../../../context/useOfficeStore";

export function BedWakeOverlay() {
  const active = useOfficeStore((s) => s.isBedCutscene);
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return undefined;
    }

    setPhase("enter");
    const toBlack = window.setTimeout(() => setPhase("black"), 40);
    const showText = window.setTimeout(() => setPhase("text"), 1440);
    const startOut = window.setTimeout(() => setPhase("out"), 4640);
    const done = window.setTimeout(() => officeStore.endBedCutscene(), 5640);

    const skip = () => officeStore.endBedCutscene();
    const onKey = (e) => {
      if (e.code === "Escape" || e.code === "KeyE" || e.code === "Space") {
        e.preventDefault();
        skip();
      }
    };
    const enableSkip = window.setTimeout(() => {
      window.addEventListener("keydown", onKey);
    }, 800);

    return () => {
      window.clearTimeout(toBlack);
      window.clearTimeout(showText);
      window.clearTimeout(startOut);
      window.clearTimeout(done);
      window.clearTimeout(enableSkip);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  if (!active && phase === "idle") return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[70] flex cursor-pointer items-center justify-center bg-black"
      onClick={() => officeStore.endBedCutscene()}
      style={{
        opacity: phase === "black" || phase === "text" ? 1 : 0,
        transition: "opacity 1.4s ease-in-out",
      }}
    >
      <p
        className="max-w-[90vw] text-center font-serif text-3xl sm:text-5xl font-bold tracking-wide text-white"
        style={{
          opacity: phase === "text" ? 1 : 0,
          transform: phase === "text" ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.55s ease-out, transform 0.55s ease-out",
        }}
      >
        You not RICH yet, Wake the fuck up
      </p>
    </div>
  );
}
