import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { PlayerControls } from "./PlayerControls";
import { InteractionRaycaster } from "./InteractionRaycaster";
import { CameraFocusController } from "./CameraFocusController";
import { OfficeScene } from "./OfficeScene";
import { brandConfig } from "../../../config/brandConfig";

export function OfficeCanvas() {
  return (
    <div className="absolute inset-0 h-full w-full bg-[#eef2f7] overflow-hidden select-none">
      <Canvas
        camera={{
          position: brandConfig.model.spawnPosition,
          fov: 68,
          near: 0.1,
          far: 60,
        }}
        dpr={[1, 1]}
        shadows={false}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.28,
          outputColorSpace: THREE.SRGBColorSpace,
          alpha: true,
          preserveDrawingBuffer: false,
        }}
      >
        <color attach="background" args={[brandConfig.theme.backgroundColor]} />
        <fog attach="fog" args={[brandConfig.theme.fogColor, 22, 55]} />

        <Suspense fallback={null}>
          <OfficeScene />
        </Suspense>

        <PlayerControls />
        <CameraFocusController />
        <InteractionRaycaster />
      </Canvas>
    </div>
  );
}
