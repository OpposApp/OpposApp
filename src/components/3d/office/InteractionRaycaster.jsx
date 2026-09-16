import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { officeStore, useOfficeStore } from "../../../context/useOfficeStore";

const CAMERA_FOCUS_TYPES = new Set(["screen", "mint", "rewards", "docs", "about", "board", "sofa", "bed", "treasury", "painting"]);

export function InteractionRaycaster() {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const centerScreen = useRef(new THREE.Vector2(0, 0));
  const hoveredRef = useRef(null);
  const interactablesRef = useRef([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const collectInteractables = () => {
      const list = [];
      scene.traverse((obj) => {
        if (obj.userData?.isInteractable || obj.name?.startsWith("interactable_")) {
          list.push(obj);
        }
      });
      interactablesRef.current = list;
    };
    collectInteractables();
    const retries = [400, 1500, 4000, 8000].map((ms) => window.setTimeout(collectInteractables, ms));
    return () => retries.forEach((id) => window.clearTimeout(id));
  }, [scene]);

  const isMintModalOpen = useOfficeStore((s) => s.isMintModalOpen);
  const isRewardsModalOpen = useOfficeStore((s) => s.isRewardsModalOpen);
  const isDocsModalOpen = useOfficeStore((s) => s.isDocsModalOpen);
  const isAboutModalOpen = useOfficeStore((s) => s.isAboutModalOpen);
  const isScreenModalOpen = useOfficeStore((s) => s.isScreenModalOpen);
  const isBoardModalOpen = useOfficeStore((s) => s.isBoardModalOpen);
  const isTreasuryModalOpen = useOfficeStore((s) => s.isTreasuryModalOpen);
  const cameraFocus = useOfficeStore((s) => s.cameraFocus);
  const isBedCutscene = useOfficeStore((s) => s.isBedCutscene);

  const anyModalOpen =
    isMintModalOpen ||
    isRewardsModalOpen ||
    isDocsModalOpen ||
    isAboutModalOpen ||
    isScreenModalOpen ||
    isBoardModalOpen ||
    isTreasuryModalOpen ||
    isBedCutscene;

  useFrame(() => {
    if (anyModalOpen || cameraFocus) {
      if (hoveredRef.current !== null) {
        hoveredRef.current = null;
        officeStore.setHoveredObject(null);
      }
      return;
    }

    frameRef.current += 1;
    const hasHover = hoveredRef.current !== null;
    if (!hasHover && frameRef.current % 2 !== 0) return;

    raycaster.current.setFromCamera(centerScreen.current, camera);
    raycaster.current.far = 4.0;

    const targets = interactablesRef.current;
    if (targets.length === 0) return;

    const intersects = raycaster.current.intersectObjects(targets, true);

    let target = null;
    for (const hit of intersects) {
      let obj = hit.object;
      while (obj && obj !== scene) {
        if (obj.userData?.isInteractable || obj.name?.startsWith("interactable_")) {
          target = obj;
          break;
        }
        obj = obj.parent;
      }
      if (target) break;
    }

    if (target) {
      const type = target.userData?.type || target.name.replace("interactable_", "");
      if (hoveredRef.current !== type) {
        hoveredRef.current = type;
        officeStore.setHoveredObject({
          name: target.name,
          type,
          label: getInteractionLabel(type),
        });
      }
    } else if (hoveredRef.current !== null) {
      hoveredRef.current = null;
      officeStore.setHoveredObject(null);
    }
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT" || e.target.isContentEditable) return;

      const state = officeStore.getState();
      const isAnyOpen =
        state.isMintModalOpen ||
        state.isRewardsModalOpen ||
        state.isDocsModalOpen ||
        state.isAboutModalOpen ||
        state.isScreenModalOpen ||
        state.isBoardModalOpen ||
        state.isTreasuryModalOpen ||
        state.isBedCutscene;

      if (e.code === "Escape" && state.cameraFocus && state.cameraFocus.phase !== "out" && !state.isBedCutscene) {
        officeStore.requestCloseModals();
        return;
      }

      if (e.code !== "KeyE") return;

      if (state.cameraFocus?.phase === "hold" && !isAnyOpen) {
        officeStore.requestCloseModals();
        return;
      }

      if (isAnyOpen || state.cameraFocus) return;

      const currentHover = hoveredRef.current;
      if (!currentHover) return;

      if (CAMERA_FOCUS_TYPES.has(currentHover)) {
        officeStore.beginCameraFocus(currentHover);
        return;
      }

      switch (currentHover) {
        case "radio":
          officeStore.nextStation();
          break;
        case "plug":
          officeStore.togglePower();
          break;
        case "door":
          officeStore.showDoorLockedNotice();
          break;
        case "guitar":
          officeStore.showGuitarNotice();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}

function getInteractionLabel(type) {
  switch (type) {
    case "radio":
      return "Press [E] to Switch Radio Station";
    case "mint":
      return "Press [E] to Mint Oppos Pass";
    case "screen":
      return "Press [E] to Sit at the Workstation";
    case "sofa":
      return "Press [E] to Sit Down";
    case "painting":
      return "Press [E] to Hail";
    case "rewards":
      return "Press [E] to View Pass SOL Rewards";
    case "treasury":
      return "Press [E] to Open Treasury Vault";
    case "docs":
      return "Press [E] to Read Docs & Protocol";
    case "about":
      return "Press [E] to View About Studio & FAQ";
    case "board":
      return "Press [E] to View Launch Roadmap";
    case "plug":
      return "Press [E] to Trip Main Circuit Breaker";
    case "door":
      return "Press [E] to Open Door";
    case "guitar":
      return "Press [E] to Play Guitar";
    case "bed":
      return "Press [E] to Sleep";
    default:
      return "Press [E] to Interact";
  }
}
