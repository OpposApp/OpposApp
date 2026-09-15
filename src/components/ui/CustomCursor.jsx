import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const mouse = useRef({ x: -100, y: -100 });
  const outerPos = useRef({ x: -100, y: -100 });
  const innerPos = useRef({ x: -100, y: -100 });
  const [hovered, setHovered] = useState(false);
  const rafId = useRef(null);

  useEffect(() => {
    const onMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseOver = (e) => {
      if (
        e.target.tagName === "BUTTON" ||
        e.target.tagName === "A" ||
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.classList.contains("interactive")
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    const animate = () => {
      // Spring lerp for outer ring (slower, springy follow)
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * 0.08;
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * 0.08;

      // Faster lerp for inner dot
      innerPos.current.x += (mouse.current.x - innerPos.current.x) * 0.25;
      innerPos.current.y += (mouse.current.y - innerPos.current.y) * 0.25;

      if (outerRef.current) {
        outerRef.current.style.transform = `translate(${outerPos.current.x}px, ${outerPos.current.y}px) translate(-50%, -50%)`;
      }
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${innerPos.current.x}px, ${innerPos.current.y}px) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <>
      {/* Outer spring ring */}
      <div
        ref={outerRef}
        className="pointer-events-none fixed left-0 top-0 z-[55] hidden md:block"
        style={{ willChange: "transform" }}
      >
        <div
          className="rounded-full border transition-all duration-300"
          style={{
            width: hovered ? "56px" : "32px",
            height: hovered ? "56px" : "32px",
            borderColor: hovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
            backgroundColor: hovered ? "rgba(255,255,255,0.06)" : "transparent",
          }}
        />
      </div>

      {/* Inner precise dot */}
      <div
        ref={innerRef}
        className="pointer-events-none fixed left-0 top-0 z-[55] hidden md:block"
        style={{ willChange: "transform" }}
      >
        <div
          className="rounded-full bg-white transition-all duration-200"
          style={{
            width: hovered ? "0px" : "4px",
            height: hovered ? "0px" : "4px",
            opacity: hovered ? 0 : 1,
          }}
        />
      </div>
    </>
  );
}
