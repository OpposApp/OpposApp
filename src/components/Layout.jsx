import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ConnectButton } from "./ConnectButton.jsx";
import { PrivySetupNotice } from "./PrivySetupNotice.jsx";
import { ShaderBackground } from "./3d/ShaderBackground.jsx";
import { CustomCursor } from "./ui/CustomCursor.jsx";
import { LoadingScreen } from "./ui/LoadingScreen.jsx";
import { brandConfig } from "../config/brandConfig.js";

const links = [
  { to: "/", label: "Studio" },
  { to: "/mint", label: "Mint Pass" },
  { to: "/rewards", label: "Rewards" },
  { to: "/docs", label: "Docs" },
];

export function Layout() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const scrollEl = document.getElementById("scroll-container");
    if (!scrollEl) return;

    const handleScroll = () => {
      const currentY = scrollEl.scrollTop;
      if (currentY > lastScrollYRef.current && currentY > 100) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      lastScrollYRef.current = currentY;
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white font-serif selection:bg-white/20 selection:text-white overflow-hidden">
      {/* Intro Loading Screen */}
      <LoadingScreen onComplete={() => setIsLoaded(true)} />

      {/* Full-screen WebGL 3D Shader Background */}
      <ShaderBackground isLoaded={isLoaded} />

      {/* Film Grain Noise Overlay */}
      <div className="noise-overlay" />

      {/* Spring Custom Cursor */}
      <CustomCursor />

      {/* Scroll Container (shader.se uses fixed inset scroll) */}
      <div
        id="scroll-container"
        className="fixed inset-0 w-screen overflow-y-auto overflow-x-hidden overscroll-none z-50"
        style={{ scrollBehavior: "smooth" }}
      >
        <PrivySetupNotice />

        {/* Floating Minimal Header (Shader.se style) */}
        <header
          className={`fixed top-0 left-0 right-0 z-[52] px-6 sm:px-10 py-5 transition-all duration-500 ${
            showNav ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
          }`}
          style={{ pointerEvents: showNav ? "auto" : "none" }}
        >
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            {/* Brand Mark */}
            <NavLink to="/" className="group flex items-center gap-2.5 shrink-0">
              <span className="font-serif text-lg font-bold tracking-widest text-white uppercase">
                Oppos
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "nav-link-active" : "nav-link-idle"}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Wallet */}
            <div className="flex items-center gap-4">
              <ConnectButton />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="mt-3 flex md:hidden gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `nav-link text-xs ${isActive ? "nav-link-active" : "nav-link-idle"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* Main Content */}
        <main className="relative z-10 mx-auto max-w-6xl px-6 sm:px-10 pt-24 pb-0">
          <Outlet />
        </main>

        {/* Contact-style Footer (Shader.se) */}
        <footer className="relative z-10 mx-auto max-w-6xl px-6 sm:px-10 mt-32 pb-12">
          <div className="border-t border-white/10 pt-16">
            <div className="grid gap-12 md:grid-cols-3">
              {/* Col 1: Brand */}
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-white">Oppos</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                  A creative protocol studio building automated revenue-sharing solutions on Solana. Based on-chain, working with holders worldwide.
                </p>
              </div>

              {/* Col 2: Navigation */}
              <div className="space-y-4">
                <p className="font-mono text-xs text-white/30 uppercase tracking-widest">Navigation</p>
                <div className="flex flex-col gap-2">
                  {links.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className="font-serif text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Col 3: Social */}
              <div className="space-y-4">
                <p className="font-mono text-xs text-white/30 uppercase tracking-widest">Connect</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={brandConfig.meta.socials.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="font-serif text-sm text-white/50 hover:text-white transition-colors"
                  >
                    X (Twitter)
                  </a>
                  <a
                    href={brandConfig.meta.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="font-serif text-sm text-white/50 hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                  <p className="font-serif text-sm text-white/50">
                    Contract Address{" "}
                    <span className="font-mono text-white/70">{brandConfig.meta.contractAddress}</span>
                  </p>
                  <a
                    href={`mailto:${brandConfig.meta.socials.email}`}
                    className="font-serif text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {brandConfig.meta.socials.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5 pt-6">
              <p className="text-xs text-white/20 font-mono">
                © {new Date().getFullYear()} Oppos Sweden AB
              </p>
              <p className="text-xs text-white/20 font-mono">
                50% holder split · 6h clock · Solana
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
