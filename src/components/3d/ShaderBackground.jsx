import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// Camera Waypoints — scroll-driven positions matching 4 sections
const cameraWaypoints = [
  { pos: new THREE.Vector3(0, 0, 6), rot: new THREE.Euler(0, 0, 0) },
  { pos: new THREE.Vector3(2.2, 0.4, 3.8), rot: new THREE.Euler(0, -0.35, 0) },
  { pos: new THREE.Vector3(-2.0, -0.8, 4.2), rot: new THREE.Euler(0.15, 0.25, 0) },
  { pos: new THREE.Vector3(0, -2.2, 2.8), rot: new THREE.Euler(-0.35, 0, 0) },
];

function CameraController({ isLoaded }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const zoomInComplete = useRef(false);

  useEffect(() => {
    // Shader.se uses a custom scroll container, we listen on #scroll-container or window
    const scrollEl = document.getElementById("scroll-container") || window;
    const handleScroll = () => {
      const el = scrollEl === window ? document.documentElement : scrollEl;
      const totalScroll = el.scrollHeight - (scrollEl === window ? window.innerHeight : el.clientHeight);
      const scrollTop = scrollEl === window ? window.scrollY : el.scrollTop;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(Math.max(scrollTop / totalScroll, 0), 1));
      }
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((state, delta) => {
    const camera = state.camera;

    // Initial Zoom-In Animation from z=30 to z=6
    if (isLoaded && !zoomInComplete.current) {
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 6, delta * 2);
      if (Math.abs(camera.position.z - 6) < 0.15) {
        zoomInComplete.current = true;
      }
      return;
    }

    if (!isLoaded) {
      camera.position.set(0, 0, 30);
      return;
    }

    // Scroll-driven Waypoint Interpolation
    const totalWaypoints = cameraWaypoints.length - 1;
    const rawIndex = scrollProgress * totalWaypoints;
    const index = Math.floor(rawIndex);
    const fraction = rawIndex - index;

    const current = cameraWaypoints[Math.min(index, totalWaypoints)];
    const next = cameraWaypoints[Math.min(index + 1, totalWaypoints)];

    const targetPos = new THREE.Vector3().lerpVectors(current.pos, next.pos, fraction);
    const targetRotX = THREE.MathUtils.lerp(current.rot.x, next.rot.x, fraction);
    const targetRotY = THREE.MathUtils.lerp(current.rot.y, next.rot.y, fraction);
    const targetRotZ = THREE.MathUtils.lerp(current.rot.z, next.rot.z, fraction);

    // Mouse tilt offset
    const mouseX = state.pointer.x * 0.4;
    const mouseY = state.pointer.y * 0.4;

    // Smoother lerp (2.5 instead of 4 for cinematic feel)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetPos.x + mouseX, delta * 2.5);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetPos.y + mouseY, delta * 2.5);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetPos.z, delta * 2.5);

    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotX, delta * 2.5);
    camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotY, delta * 2.5);
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetRotZ, delta * 2.5);
  });

  return null;
}

function FloatingCrystal() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.2} floatIntensity={1.5}>
      <mesh ref={meshRef} scale={2}>
        <icosahedronGeometry args={[1.5, 4]} />
        <MeshDistortMaterial
          color="#6366f1"
          emissive="#1e1b4b"
          roughness={0.15}
          metalness={0.95}
          distort={0.35}
          speed={2.5}
          wireframe={true}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const count = 300;
  const positions = useRef(new Float32Array(count * 3));

  useEffect(() => {
    for (let i = 0; i < count * 3; i += 3) {
      positions.current[i] = (Math.random() - 0.5) * 25;
      positions.current[i + 1] = (Math.random() - 0.5) * 25;
      positions.current[i + 2] = (Math.random() - 0.5) * 25;
    }
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export function ShaderBackground({ isLoaded = true }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-screen w-screen bg-black overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        className="h-full w-full"
        style={{ opacity: 0.8 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#818cf8" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#38bdf8" />

        <CameraController isLoaded={isLoaded} />
        <FloatingCrystal />
        <ParticleField />
      </Canvas>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}
