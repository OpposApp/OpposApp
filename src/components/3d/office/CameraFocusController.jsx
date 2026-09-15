import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { officeStore, useOfficeStore } from "../../../context/useOfficeStore";

const UP = new THREE.Vector3(0, 1, 0);

const FOCUS_POSES = {
  screen: {
    duration: 0.88,
    fov: 58,
    position: [1.48, 1.18, -1.02],
    lookAt: [1.2, 1.28, -1.94],
  },
  mint: {
    duration: 0.68,
    fov: 60,
    position: [0.42, 1.36, -1.12],
    lookAt: [0.35, 1.33, -1.85],
  },
  rewards: {
    duration: 0.62,
    fov: 60,
    position: [1.72, 1.22, -1.12],
    lookAt: [1.82, 0.94, -1.68],
  },
  treasury: {
    duration: 0.7,
    fov: 58,
    position: [-0.55, 1.42, 3.52],
    lookAt: [-1.55, 0.78, 5.18],
  },
  docs: {
    duration: 0.72,
    fov: 62,
    position: [4.55, 1.48, -1.8],
    lookAt: [5.75, 1.5, -1.8],
  },
  board: {
    duration: 0.72,
    fov: 62,
    position: [4.55, 1.72, 1.2],
    lookAt: [5.85, 2.05, 1.2],
  },
  sofa: {
    duration: 0.85,
    fov: 62,
    position: [4.62, 1.13, 4.36],
    lookAt: [3.15, 1.05, 4.2],
  },
  painting: {
    duration: 0.92,
    fov: 56,
    position: [1.72, 1.08, 4.05],
    lookAt: [1.72, 1.92, 5.9],
    floorLookAt: [1.72, 0.05, 4.48],
    bowDrop: 0.16,
  },
  about: {
    duration: 0.68,
    fov: 60,
    position: [3.45, 1.55, -4.65],
    lookAt: [3.45, 1.72, -5.76],
  },
  bed: {
    duration: 1.05,
    fov: 64,
    // Mattress top ~0.95, pillows ~1.26 — sit above the pillow at the head,
    // looking down the bed toward the door (not through the platform).
    position: [-4.35, 1.48, -4.62],
    lookAt: [-4.85, 1.52, 5.82],
  },
};

const MODAL_OPENERS = {
  screen: () => officeStore.setScreenModalOpen(true),
  mint: () => officeStore.setMintModalOpen(true),
  rewards: () => officeStore.setRewardsModalOpen(true),
  treasury: () => officeStore.setTreasuryModalOpen(true),
  docs: () => officeStore.setDocsModalOpen(true),
  about: () => officeStore.setAboutModalOpen(true),
  board: () => officeStore.setBoardModalOpen(true),
};

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function quatLookAt(from, to) {
  const m = new THREE.Matrix4();
  m.lookAt(from, to, UP);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

function hailLookBlend(t) {
  const holdPhoto = 1.05;
  const toFloor = 0.88;
  const holdFloor = 0.62;
  const toPhoto = 0.88;
  const total = holdPhoto + toFloor + holdFloor + toPhoto;
  const p = t % total;
  if (p < holdPhoto) return 0;
  if (p < holdPhoto + toFloor) return easeInOutCubic((p - holdPhoto) / toFloor);
  if (p < holdPhoto + toFloor + holdFloor) return 1;
  return 1 - easeInOutCubic((p - holdPhoto - toFloor - holdFloor) / toPhoto);
}

export function CameraFocusController() {
  const { camera } = useThree();
  const focus = useOfficeStore((s) => s.cameraFocus);
  const tween = useRef(null);
  const saved = useRef(null);
  const lastPhase = useRef(null);
  const hail = useRef(null);

  useEffect(() => {
    if (!focus) {
      lastPhase.current = null;
      tween.current = null;
      hail.current = null;
      return;
    }
    if (focus.phase === lastPhase.current) return;
    lastPhase.current = focus.phase;

    if (focus.phase === "in") {
      const pose = FOCUS_POSES[focus.interactType];
      if (!pose) {
        officeStore.clearCameraFocus();
        return;
      }
      saved.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        fov: camera.fov,
      };
      const toPos = new THREE.Vector3(...pose.position);
      tween.current = {
        dir: "in",
        t: 0,
        duration: pose.duration,
        fromPos: camera.position.clone(),
        fromQuat: camera.quaternion.clone(),
        fromFov: camera.fov,
        toPos,
        toQuat: quatLookAt(toPos, new THREE.Vector3(...pose.lookAt)),
        toFov: pose.fov,
        interactType: focus.interactType,
      };
    }

    if (focus.phase === "hold" && focus.interactType === "painting") {
      const pose = FOCUS_POSES.painting;
      const sitPos = new THREE.Vector3(...pose.position);
      hail.current = {
        sitPos,
        photoQuat: quatLookAt(sitPos, new THREE.Vector3(...pose.lookAt)),
        floorQuat: quatLookAt(sitPos, new THREE.Vector3(...pose.floorLookAt)),
        bowDrop: pose.bowDrop ?? 0.16,
        t: 0,
      };
    }

    if (focus.phase === "out" && saved.current) {
      hail.current = null;
      tween.current = {
        dir: "out",
        t: 0,
        duration: 0.7,
        fromPos: camera.position.clone(),
        fromQuat: camera.quaternion.clone(),
        fromFov: camera.fov,
        toPos: saved.current.position,
        toQuat: saved.current.quaternion,
        toFov: saved.current.fov,
      };
    }
  }, [focus, camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const tw = tween.current;
    if (tw) {
      tw.t += dt;
      const u = easeInOutCubic(Math.min(1, tw.t / tw.duration));
      camera.position.lerpVectors(tw.fromPos, tw.toPos, u);
      camera.quaternion.slerpQuaternions(tw.fromQuat, tw.toQuat, u);
      camera.fov = THREE.MathUtils.lerp(tw.fromFov, tw.toFov, u);
      camera.updateProjectionMatrix();

      if (u < 1) return;

      if (tw.dir === "in") {
        tween.current = null;
        officeStore.markCameraFocusHold();
        if (tw.interactType === "bed") {
          window.setTimeout(() => officeStore.startBedCutscene(), 750);
        } else {
          const openModal = MODAL_OPENERS[tw.interactType];
          if (openModal) openModal();
          else if (tw.interactType !== "painting" && tw.interactType !== "sofa") {
            officeStore.lockPointer();
          }
        }
        return;
      }

      tween.current = null;
      saved.current = null;
      officeStore.clearCameraFocus();
      officeStore.lockPointer();
      return;
    }

    const hailState = hail.current;
    if (hailState && focus?.phase === "hold" && focus.interactType === "painting") {
      hailState.t += dt;
      const u = hailLookBlend(hailState.t);
      camera.position.copy(hailState.sitPos);
      camera.position.y -= hailState.bowDrop * u;
      camera.quaternion.slerpQuaternions(hailState.photoQuat, hailState.floorQuat, u);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
