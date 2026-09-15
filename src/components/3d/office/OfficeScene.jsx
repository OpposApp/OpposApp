import React, { Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import { OfficeEnvironment } from "./OfficeEnvironment";
import { brandConfig } from "../../../config/brandConfig";

function ExternalGLBModel({ url }) {
  const { scene } = useGLTF(url);

  React.useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name.startsWith("interactable_")) {
          child.userData.isInteractable = true;
          child.userData.type = child.name.replace("interactable_", "");
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

export function OfficeScene() {
  // If user enabled custom GLB, render external GLB model
  if (brandConfig.model.useCustomGlb && brandConfig.model.glbPath) {
    return (
      <Suspense fallback={<OfficeEnvironment />}>
        <ExternalGLBModel url={brandConfig.model.glbPath} />
      </Suspense>
    );
  }

  // Default: Instant procedural high-fidelity 3D studio
  return <OfficeEnvironment />;
}
