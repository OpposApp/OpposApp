import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { brandConfig } from "../../../config/brandConfig";
import { officeStore, useOfficeStore } from "../../../context/useOfficeStore";

export function PlayerControls() {
  const { camera } = useThree();
  const controlsRef = useRef(null);

  // Missing input & movement state refs
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    shift: false,
  });
  const moveVector = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const headBobTimer = useRef(0);
  const baseEyeHeight = brandConfig.model.spawnPosition?.[1] || 1.6;

  const isLocked = useOfficeStore((s) => s.isLocked);
  const hasStarted = useOfficeStore((s) => s.hasStarted);
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
    isTreasuryModalOpen;

  // Unlock mouse and drop sticky WASD when a modal / focus / cutscene takes over
  useEffect(() => {
    if (anyModalOpen || cameraFocus || isBedCutscene) {
      keys.current = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        shift: false,
      };
      controlsRef.current?.unlock();
    }
  }, [anyModalOpen, cameraFocus, isBedCutscene]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT" || e.target.isContentEditable) return;
      const s = officeStore.getState();
      if (
        s.isMintModalOpen ||
        s.isRewardsModalOpen ||
        s.isDocsModalOpen ||
        s.isAboutModalOpen ||
        s.isScreenModalOpen ||
        s.isBoardModalOpen ||
        s.isTreasuryModalOpen ||
        s.isBedCutscene ||
        s.cameraFocus
      ) {
        return;
      }

      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.shift = true;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.shift = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (anyModalOpen || isBedCutscene || cameraFocus || !isLocked || !hasStarted) return;

    // Constrain delta to avoid sudden huge jumps if tab was inactive
    const safeDelta = Math.min(delta, 0.1);
    const speed = keys.current.shift
      ? brandConfig.model.sprintSpeed
      : brandConfig.model.moveSpeed;

    moveVector.current.set(0, 0, 0);

    if (keys.current.forward) moveVector.current.z -= 1;
    if (keys.current.backward) moveVector.current.z += 1;
    if (keys.current.left) moveVector.current.x -= 1;
    if (keys.current.right) moveVector.current.x += 1;

    const isMoving = moveVector.current.lengthSq() > 0;
    if (isMoving) {
      moveVector.current.normalize();
    }

    // Velocity dampening & acceleration
    velocity.current.x = moveVector.current.x * speed * safeDelta;
    velocity.current.z = moveVector.current.z * speed * safeDelta;

    if (!isMoving) {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, baseEyeHeight, 0.1);
      return;
    }

    // Proposed movement
    const prevX = camera.position.x;
    const prevZ = camera.position.z;

    if (controlsRef.current) {
      controlsRef.current.moveRight(velocity.current.x);
      controlsRef.current.moveForward(-velocity.current.z);
    }

    // Collision Detection: Room outer perimeter bounds (with player radius padding 0.35m)
    const { minX, maxX, minZ, maxZ } = brandConfig.model.bounds;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, minX, maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, minZ, maxZ);

    // Collision Detection: Solid Furniture Obstacles (with player collision radius)
    const obstacles = [
      // 1. Bed & Bedside Nightstand in Corner (Flush to back & left wall)
      { minX: -6.0, maxX: -2.5, minZ: -6.0, maxZ: -2.35 },
      // 2. Main Workstation Desk & Ergonomic Chair
      { minX: -0.25, maxX: 3.05, minZ: -2.75, maxZ: -0.55 },
      // 3. Lounge — table (into room), chair (leave west approach for sit), guitar, plant
      { minX: 3.25, maxX: 4.45, minZ: 3.75, maxZ: 4.95 },
      { minX: 4.85, maxX: 5.65, minZ: 3.75, maxZ: 4.95 },
      { minX: 4.65, maxX: 5.65, minZ: 1.65, maxZ: 2.75 },
      { minX: 5.05, maxX: 5.65, minZ: 4.95, maxZ: 5.65 },
      // 4. Tall Bookshelf on East Wall
      { minX: 5.15, maxX: 6.0, minZ: -2.95, maxZ: -0.65 },
      // 5. Vinyl Turntable Credenza Console
      { minX: 4.75, maxX: 6.0, minZ: -0.95, maxZ: 0.85 },
      // 6. Tall Snake Plant
      { minX: 4.85, maxX: 6.0, minZ: -3.95, maxZ: -2.85 },
      // 7. Large Potted Monstera Deliciosa
      { minX: -1.65, maxX: -0.4, minZ: -5.9, maxZ: -4.65 },
      // 8. Treasury chest beside the south door
      { minX: -2.38, maxX: -0.72, minZ: 4.38, maxZ: 5.92 },
    ];

    const isInsideAnyObstacle = (x, z) => {
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        if (x >= o.minX && x <= o.maxX && z >= o.minZ && z <= o.maxZ) {
          return true;
        }
      }
      return false;
    };

    const targetX = camera.position.x;
    const targetZ = camera.position.z;

    if (isInsideAnyObstacle(targetX, targetZ)) {
      // Allow smooth sliding along X if X is free while Z is blocked
      if (!isInsideAnyObstacle(targetX, prevZ)) {
        camera.position.z = prevZ;
      }
      // Allow smooth sliding along Z if Z is free while X is blocked
      else if (!isInsideAnyObstacle(prevX, targetZ)) {
        camera.position.x = prevX;
      }
      // Both directions blocked by obstacle
      else {
        camera.position.x = prevX;
        camera.position.z = prevZ;
      }
    }

    // Subtle Head Bobbing when walking
    headBobTimer.current += safeDelta * (keys.current.shift ? 14 : 9);
    const bobOffset = Math.sin(headBobTimer.current) * 0.035;
    camera.position.y = baseEyeHeight + bobOffset;
  });

  return (
    <PointerLockControls
      enabled={!cameraFocus}
      ref={(ctrl) => {
        controlsRef.current = ctrl;
        officeStore.registerControls(ctrl);
      }}
      onLock={() => officeStore.setIsLocked(true)}
      onUnlock={() => officeStore.setIsLocked(false)}
    />
  );
}
