import { useSyncExternalStore } from "react";
import { brandConfig } from "../config/brandConfig";

const INITIAL_STATE = {
  isLocked: false,
  hasStarted: false,
  hoveredObject: null,
  isRadioPlaying: false,
  currentStationIndex: 0,
  volume: brandConfig.audio.defaultVolume,
  isMintModalOpen: false,
  isRewardsModalOpen: false,
  isDocsModalOpen: false,
  isAboutModalOpen: false,
  isScreenModalOpen: false,
  isBoardModalOpen: false,
  isTreasuryModalOpen: false,
  isPowerOff: false,
  doorLockedNotice: false,
  guitarNotice: false,
  isBedCutscene: false,
  cameraFocus: null,
};

let doorLockedNoticeTimer = null;
let guitarNoticeTimer = null;

const listeners = new Set();
let state = { ...INITIAL_STATE };

function emitChange() {
  listeners.forEach((listener) => listener());
}

let controlsInstance = null;

export const officeStore = {
  getState: () => state,
  setState: (fnOrPartial) => {
    const next = typeof fnOrPartial === "function" ? fnOrPartial(state) : fnOrPartial;
    state = { ...state, ...next };
    emitChange();
  },
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  registerControls: (controls) => {
    controlsInstance = controls;
  },

  lockPointer: () => {
    try {
      if (controlsInstance && typeof controlsInstance.lock === "function") {
        controlsInstance.lock();
      }
    } catch (e) {
      console.warn("Could not lock pointer:", e);
    }
  },

  unlockPointer: () => {
    try {
      if (controlsInstance && typeof controlsInstance.unlock === "function") {
        controlsInstance.unlock();
      }
    } catch (e) {
      console.warn("Could not unlock pointer:", e);
    }
  },

  beginCameraFocus: (interactType) => {
    if (state.cameraFocus) return;
    officeStore.unlockPointer();
    officeStore.setState({
      cameraFocus: { phase: "in", interactType },
      hoveredObject: null,
    });
  },

  markCameraFocusHold: () => {
    if (!state.cameraFocus) return;
    officeStore.setState({
      cameraFocus: { ...state.cameraFocus, phase: "hold" },
    });
  },

  clearCameraFocus: () => {
    officeStore.setState({ cameraFocus: null });
  },

  requestCloseModals: () => {
    const focus = state.cameraFocus;
    officeStore.closeAllModals();
    if (focus && focus.phase !== "out") {
      officeStore.unlockPointer();
      officeStore.setState({ cameraFocus: { ...focus, phase: "out" } });
    }
  },

  setIsLocked: (isLocked) => {
    officeStore.setState({ isLocked, hasStarted: true });
  },

  setHoveredObject: (hoveredObject) => {
    officeStore.setState({ hoveredObject });
  },

  toggleRadio: () => {
    officeStore.setState((s) => ({ isRadioPlaying: !s.isRadioPlaying }));
  },

  setRadioPlaying: (isRadioPlaying) => {
    officeStore.setState({ isRadioPlaying });
  },

  nextStation: () => {
    const total = brandConfig.audio.stations.length;
    if (total === 0) return;
    officeStore.setState((s) => ({
      currentStationIndex: (s.currentStationIndex + 1) % total,
      isRadioPlaying: true,
    }));
  },

  setStationIndex: (index) => {
    officeStore.setState({ currentStationIndex: index, isRadioPlaying: true });
  },

  setVolume: (volume) => {
    officeStore.setState({ volume });
  },

  setScreenModalOpen: (isScreenModalOpen) => {
    officeStore.setState({ isScreenModalOpen });
  },

  setBoardModalOpen: (isBoardModalOpen) => {
    officeStore.setState({ isBoardModalOpen });
  },

  setTreasuryModalOpen: (isTreasuryModalOpen) => {
    officeStore.setState({ isTreasuryModalOpen });
  },

  setMintModalOpen: (isMintModalOpen) => {
    officeStore.setState({ isMintModalOpen });
  },

  setRewardsModalOpen: (isRewardsModalOpen) => {
    officeStore.setState({ isRewardsModalOpen });
  },

  setDocsModalOpen: (isDocsModalOpen) => {
    officeStore.setState({ isDocsModalOpen });
  },

  setAboutModalOpen: (isAboutModalOpen) => {
    officeStore.setState({ isAboutModalOpen });
  },

  closeAllModals: () => {
    officeStore.setState({
      isMintModalOpen: false,
      isRewardsModalOpen: false,
      isDocsModalOpen: false,
      isAboutModalOpen: false,
      isScreenModalOpen: false,
      isBoardModalOpen: false,
      isTreasuryModalOpen: false,
    });
  },

  togglePower: () => {
    officeStore.setState((s) => ({ isPowerOff: !s.isPowerOff }));
  },

  showDoorLockedNotice: () => {
    if (doorLockedNoticeTimer) window.clearTimeout(doorLockedNoticeTimer);
    officeStore.setState({ doorLockedNotice: true });
    doorLockedNoticeTimer = window.setTimeout(() => {
      officeStore.setState({ doorLockedNotice: false });
      doorLockedNoticeTimer = null;
    }, 2800);
  },

  showGuitarNotice: () => {
    if (guitarNoticeTimer) window.clearTimeout(guitarNoticeTimer);
    officeStore.setState({ guitarNotice: true });
    guitarNoticeTimer = window.setTimeout(() => {
      officeStore.setState({ guitarNotice: false });
      guitarNoticeTimer = null;
    }, 3200);
  },

  startBedCutscene: () => {
    if (state.isBedCutscene) return;
    officeStore.setState({ isBedCutscene: true });
  },

  endBedCutscene: () => {
    officeStore.setState({ isBedCutscene: false });
    if (state.cameraFocus?.interactType === "bed") {
      officeStore.requestCloseModals();
    }
  },

  resetAll: () => {
    officeStore.unlockPointer();
    if (doorLockedNoticeTimer) {
      window.clearTimeout(doorLockedNoticeTimer);
      doorLockedNoticeTimer = null;
    }
    if (guitarNoticeTimer) {
      window.clearTimeout(guitarNoticeTimer);
      guitarNoticeTimer = null;
    }
    controlsInstance = null;
    state = { ...INITIAL_STATE };
    emitChange();
  },
};

export function useOfficeStore(selector = (s) => s) {
  return useSyncExternalStore(
    officeStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
