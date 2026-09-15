import { useEffect, useState } from "react";
import { OfficeCanvas } from "../components/3d/office/OfficeCanvas";
import { OfficeHUD } from "../components/ui/office/OfficeHUD";
import { RadioPlayer } from "../components/ui/office/RadioPlayer";
import { MintModal } from "../components/ui/office/MintModal";
import { RewardsModal } from "../components/ui/office/RewardsModal";
import { DocsModal } from "../components/ui/office/DocsModal";
import { AboutModal } from "../components/ui/office/AboutModal";
import { ScreenModal } from "../components/ui/office/ScreenModal";
import { ProjectBoardModal } from "../components/ui/office/ProjectBoardModal";
import { TreasuryModal } from "../components/ui/office/TreasuryModal";
import { EasterEggOverlay } from "../components/ui/office/EasterEggOverlay";
import { BedWakeOverlay } from "../components/ui/office/BedWakeOverlay";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { PrivySetupNotice } from "../components/PrivySetupNotice";
import { useOfficeStore, officeStore } from "../context/useOfficeStore";
import { clearTextureCache } from "../components/3d/office/proceduralTextures";

export function OfficePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const isMintModalOpen = useOfficeStore((s) => s.isMintModalOpen);
  const isRewardsModalOpen = useOfficeStore((s) => s.isRewardsModalOpen);
  const isDocsModalOpen = useOfficeStore((s) => s.isDocsModalOpen);
  const isAboutModalOpen = useOfficeStore((s) => s.isAboutModalOpen);
  const isScreenModalOpen = useOfficeStore((s) => s.isScreenModalOpen);
  const isBoardModalOpen = useOfficeStore((s) => s.isBoardModalOpen);
  const isTreasuryModalOpen = useOfficeStore((s) => s.isTreasuryModalOpen);

  useEffect(() => {
    document.body.classList.add("studio-mode");
    setIsLoaded(true);
    return () => {
      document.body.classList.remove("studio-mode");
      officeStore.resetAll();
      clearTextureCache();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen bg-black overflow-hidden select-none">
      {!introDone && (
        <LoadingScreen
          onComplete={() => setIntroDone(true)}
        />
      )}

      {isLoaded && <OfficeCanvas />}
      {introDone && (
        <div className="animate-fade-in">
          <OfficeHUD />
          <RadioPlayer />
        </div>
      )}

      <div className="pointer-events-none fixed top-4 left-1/2 z-[55] -translate-x-1/2">
        <PrivySetupNotice />
      </div>

      {isMintModalOpen && <MintModal />}
      {isRewardsModalOpen && <RewardsModal />}
      {isDocsModalOpen && <DocsModal />}
      {isAboutModalOpen && <AboutModal />}
      {isScreenModalOpen && <ScreenModal />}
      {isBoardModalOpen && <ProjectBoardModal />}
      {isTreasuryModalOpen && <TreasuryModal />}
      <EasterEggOverlay />
      <BedWakeOverlay />
    </div>
  );
}
