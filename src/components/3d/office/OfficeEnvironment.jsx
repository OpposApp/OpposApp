import React, { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { preloadFont } from "troika-three-text";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useOfficeStore } from "../../../context/useOfficeStore";
import { brandConfig } from "../../../config/brandConfig";
import {
  getWoodFloorTexture,
  getWoodFloorNormalMap,
  getRugTexture,
  getRugNormalMap,
  getDeskRugTexture,
  getMarbleTexture,
  getMarbleNormalMap,
  getMainScreenTexture,
  getVerticalScreenTexture,
  getArtPosterTexture,
  getRadioGrilleTexture,
  getWindowViewTexture,
  getBookSpineTexture,
  getBookSpineNormalMap,
} from "./proceduralTextures";
import { OFFICE_FONTS } from "./officeFonts";

// Preload real PBR 3D models
useGLTF.preload("/Bed.glb");
useGLTF.preload("/GamingChair.glb");
useGLTF.preload("/PC.glb");
useGLTF.preload("/Plant.glb");
useGLTF.preload("/Bookshelf.glb");
useGLTF.preload("/models/sheen-chair.glb");
useGLTF.preload("/models/coffee-mug.glb");
useGLTF.preload("/models/rolex.glb");
useGLTF.preload("/models/boombox.glb");
useGLTF.preload("/TreasuryChest.glb");

function SheenArmchair({ scale = 1, position = [0, 0, 0], ...props }) {
  const { scene } = useGLTF("/models/sheen-chair.glb");
  const { clone, floorY } = React.useMemo(() => {
    const c = scene.clone();
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    return { clone: c, floorY: -box.min.y };
  }, [scene]);
  const [x, y, z] = position;
  return (
    <primitive
      object={clone}
      position={[x, y + floorY * scale, z]}
      scale={scale}
      {...props}
    />
  );
}

function CoffeeMug(props) {
  const { scene } = useGLTF("/models/coffee-mug.glb");
  const clone = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} {...props} />;
}

function RolexWatch(props) {
  const { scene } = useGLTF("/models/rolex.glb");
  const clone = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} {...props} />;
}

function VintageBoombox(props) {
  const { scene } = useGLTF("/models/boombox.glb");
  const clone = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} {...props} />;
}

// Main GLB models — all are centered at origin, so we lift them by half-height
// so their feet sit on the floor, and enable shadows on every child mesh.
function useShadowClone(url, { cast = true } = {}) {
  const { scene } = useGLTF(url);
  return React.useMemo(() => {
    const c = scene.clone();
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false;
        o.receiveShadow = false;
        if (o.material) o.material.envMapIntensity = 1.0;
      }
    });
    return c;
  }, [scene, cast]);
}

// mesh minY values measured from the GLB files
const GLB_HALF = { bed: 0.42, chair: 0.95, pc: 0.72, plant: 0.95, shelf: 1.0 };

function BedModel({ position = [0, 0, 0], scale = 1.4, ...props }) {
  const clone = useShadowClone("/Bed.glb");
  const [x, y, z] = position;
  return <primitive object={clone} position={[x, y + GLB_HALF.bed * scale, z]} scale={scale} {...props} />;
}

function GamingChairModel({ position = [0, 0, 0], scale = 0.7, ...props }) {
  const clone = useShadowClone("/GamingChair.glb");
  const [x, y, z] = position;
  return <primitive object={clone} position={[x, y + GLB_HALF.chair * scale, z]} scale={scale} {...props} />;
}

function PCModel({ position = [0, 0, 0], scale = 0.34, ...props }) {
  const clone = useShadowClone("/PC.glb");
  const [x, y, z] = position;
  return <primitive object={clone} position={[x, y + GLB_HALF.pc * scale, z]} scale={scale} {...props} />;
}

function PlantModel({ position = [0, 0, 0], scale = 0.85, ...props }) {
  const clone = useShadowClone("/Plant.glb", { cast: false });
  const [x, y, z] = position;
  return <primitive object={clone} position={[x, y + GLB_HALF.plant * scale, z]} scale={scale} {...props} />;
}

function BookshelfModel({ position = [0, 0, 0], scale = 1, ...props }) {
  const clone = useShadowClone("/Bookshelf.glb");
  const [x, y, z] = position;
  return <primitive object={clone} position={[x, y + GLB_HALF.shelf * scale, z]} scale={scale} {...props} />;
}

function FramedAlonPainting({ map, woodMap, hovered = false }) {
  const artW = 0.72;
  const artH = 0.72 * (1389 / 768);
  const matX = 0.058;
  const matY = 0.072;
  const rail = 0.05;
  const innerW = artW + matX * 2;
  const innerH = artH + matY * 2;
  const outerW = innerW + rail * 2;
  const outerH = innerH + rail * 2;
  return (
    <group>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[outerW, outerH, 0.028]} />
        <meshStandardMaterial color="#1c140e" roughness={0.7} />
      </mesh>
      {[
        [0, outerH / 2 - rail / 2, outerW, rail],
        [0, -(outerH / 2 - rail / 2), outerW, rail],
        [-(outerW / 2 - rail / 2), 0, rail, innerH],
        [outerW / 2 - rail / 2, 0, rail, innerH],
      ].map(([fx, fy, fw, fh], i) => (
        <mesh key={`alon-frame-${i}`} position={[fx, fy, 0.018]} castShadow>
          <boxGeometry args={[fw, fh, 0.055]} />
          <meshStandardMaterial
            map={woodMap}
            color={hovered ? "#a87848" : "#6b4423"}
            roughness={0.42}
            metalness={hovered ? 0.16 : 0.08}
            envMapIntensity={1.05}
          />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.014]}>
        <planeGeometry args={[innerW, innerH]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[artW + 0.012, artH + 0.012]} />
        <meshStandardMaterial
          color={hovered ? "#e0c56a" : "#c2a24a"}
          metalness={0.72}
          roughness={0.28}
          envMapIntensity={1.1}
        />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[artW, artH]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  );
}

function TreasuryChestModel({ scale = 0.4, position = [0, 0, 0], ...props }) {
  const { scene } = useGLTF("/TreasuryChest.glb");
  const { clone, floorY } = React.useMemo(() => {
    const c = scene.clone();
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false;
        o.receiveShadow = false;
        if (o.material) o.material.envMapIntensity = 1.0;
      }
    });
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    return { clone: c, floorY: -box.min.y };
  }, [scene]);
  const [x, y, z] = position;
  return (
    <primitive
      object={clone}
      position={[x, y + floorY * scale, z]}
      scale={scale}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Realistic procedural acoustic guitar (dreadnought), real-world metres.
// Origin = bottom of body, Y up, top face toward +Z.
// ─────────────────────────────────────────────────────────────
// ── Procedural canvas textures for furniture ──────────────────
function makeWoodTexture(base, dark, repeat = [1, 1]) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  // cathedral grain arcs
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * 512;
    x.strokeStyle = dark;
    x.globalAlpha = 0.05 + Math.random() * 0.16;
    x.lineWidth = 0.6 + Math.random() * 2.4;
    x.beginPath();
    x.moveTo(-20, y);
    for (let px = -20; px <= 532; px += 26) {
      x.lineTo(px, y + Math.sin((px + i * 40) / 90) * (4 + (i % 5) * 3));
    }
    x.stroke();
  }
  // fine pores
  x.globalAlpha = 0.22;
  for (let i = 0; i < 1400; i++) {
    x.fillStyle = dark;
    x.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random(), 0.8);
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  return t;
}

function makeCorkTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#c9a26d"; x.fillRect(0, 0, 512, 512);
  const tones = ["#b98d55", "#d9b784", "#a97e49", "#e0c294", "#8f6a3c"];
  for (let i = 0; i < 5200; i++) {
    x.fillStyle = tones[(Math.random() * tones.length) | 0];
    x.globalAlpha = 0.25 + Math.random() * 0.5;
    const w = 2 + Math.random() * 9, h = 1.5 + Math.random() * 6;
    x.beginPath();
    x.ellipse(Math.random() * 512, Math.random() * 512, w / 2, h / 2, Math.random() * Math.PI, 0, Math.PI * 2);
    x.fill();
  }
  // dark specks
  x.globalAlpha = 0.35;
  for (let i = 0; i < 900; i++) {
    x.fillStyle = "#6b4a24";
    x.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // edge vignette so the recess reads
  x.globalAlpha = 1;
  const g = x.createRadialGradient(256, 256, 140, 256, 256, 380);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(40,24,10,0.34)");
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Muted real-world book spine palette — cloth, leather, paperback */
const BOOK_SPINE_COLORS = [
  "#722f37", "#1a2744", "#2f4f4f", "#3d3226", "#4a3728", "#5c4033",
  "#2d4a3e", "#1e3a3a", "#4a5568", "#6b4423", "#5c4a3a", "#3b4252",
  "#7c4a5c", "#284028", "#1c2e4a", "#6b3a3a", "#4a5d23", "#8b7355",
  "#2c1810", "#5a4a6b", "#c9b896", "#8b6914", "#4a6080", "#6b5344",
];

function bookSpineMaterialProps(col, seed, spineTex, spineNormal) {
  const isLeather = seed % 5 === 0;
  const hasFoil = seed % 11 === 0;
  return {
    map: spineTex,
    normalMap: spineNormal,
    normalScale: new THREE.Vector2(0.38, 0.22),
    color: col,
    roughness: isLeather ? 0.58 + (seed % 3) * 0.05 : 0.74 + (seed % 4) * 0.04,
    metalness: hasFoil ? 0.22 : isLeather ? 0.06 : 0.01,
    envMapIntensity: hasFoil ? 0.85 : 0.48,
  };
}

/** Shelf center Y → book mesh center Y (sits flush on 0.04-thick shelf) */
function bookCenterY(shelfY, bookHeight) {
  return shelfY + 0.02 + bookHeight / 2;
}

/** Deterministic pseudo-random book row generator */
function generateBookRow(startX, endX, count, seed = 0) {
  const books = [];
  let x = startX;
  for (let i = 0; i < count; i++) {
    const w = 0.038 + ((i * 7 + seed) % 6) * 0.006;
    const h = 0.19 + ((i * 11 + seed) % 8) * 0.018;
    if (x + w > endX) break;
    books.push({
      x: x + w / 2,
      w,
      h,
      col: BOOK_SPINE_COLORS[(i + seed) % BOOK_SPINE_COLORS.length],
      depth: 0.18 + ((i + seed) % 4) * 0.012,
      rotZ: ((i * 5 + seed) % 5 - 2) * 0.008,
    });
    x += w + 0.0025;
  }
  return books;
}

function ShelfBooks({ shelfY, books, id = "shelf", spineTex, spineNormal }) {
  return books.map((book, i) => {
    const { x, h, w, col, depth = 0.21, rotZ = 0 } = book;
    const seed = i + id.length * 3 + Math.round(shelfY * 10);
    const matProps = bookSpineMaterialProps(col, seed, spineTex, spineNormal);
    return (
      <group
        key={`${id}-${shelfY}-${i}`}
        position={[x, bookCenterY(shelfY, h), 0.04]}
        rotation={[0, 0, rotZ]}
      >
        <RoundedBox args={[w, h, depth]} radius={0.004} smoothness={2}>
          <meshStandardMaterial {...matProps} />
        </RoundedBox>
        {/* Aged page edges */}
        <mesh position={[0, h / 2 - 0.003, 0]}>
          <boxGeometry args={[w * 0.88, 0.006, depth * 0.9]} />
          <meshStandardMaterial color="#ebe3d0" roughness={0.96} envMapIntensity={0.2} />
        </mesh>
        {seed % 11 === 0 && (
          <mesh position={[0, h * 0.1, depth / 2 + 0.001]}>
            <planeGeometry args={[w * 0.82, h * 0.07]} />
            <meshStandardMaterial color="#c9a047" metalness={0.72} roughness={0.32} envMapIntensity={1.0} />
          </mesh>
        )}
      </group>
    );
  });
}

function HorizontalBookStack({ shelfY, x, z = 0.04, layers, spineTex, spineNormal }) {
  let stackY = shelfY + 0.02;
  return layers.map(({ w, d, col }, i) => {
    const h = 0.038;
    const cy = stackY + h / 2;
    stackY += h + 0.002;
    const matProps = bookSpineMaterialProps(col, i + 40, spineTex, spineNormal);
    return (
      <RoundedBox
        key={i}
        args={[w, h, d]}
        radius={0.003}
        smoothness={2}
        position={[x, cy, z]}
        rotation={[0, i * 0.04, 0]}
      >
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
    );
  });
}

// ── Full-length leaning ARCH mirror with real reflection ──────
function ArchMirror(props) {
  const H_STRAIGHT = 1.16;   // straight side height
  const HALF_W = 0.40;       // outer half width
  const FRAME = 0.05;

  const { frameGeo, glassGeo } = React.useMemo(() => {
    const arch = (halfW, straight, y0) => {
      const s = new THREE.Shape();
      s.moveTo(-halfW, y0);
      s.lineTo(-halfW, y0 + straight);
      s.absarc(0, y0 + straight, halfW, Math.PI, 0, true);
      s.lineTo(halfW, y0);
      s.closePath();
      return s;
    };
    const outer = arch(HALF_W, H_STRAIGHT, 0);
    const innerShape = arch(HALF_W - FRAME, H_STRAIGHT - FRAME * 0.4, FRAME);
    const hole = new THREE.Path();
    hole.setFromPoints(innerShape.getPoints(64));
    outer.holes.push(hole);
    const frameGeo = new THREE.ExtrudeGeometry(outer, {
      depth: 0.05, bevelEnabled: true, bevelThickness: 0.006,
      bevelSize: 0.006, bevelSegments: 3, curveSegments: 48,
    });
    const glassGeo = new THREE.ShapeGeometry(innerShape, 64);
    return { frameGeo, glassGeo };
  }, []);

  return (
    <group {...props}>
      {/* Backing board (so the mirror is not see-through from behind) */}
      <mesh geometry={glassGeo} position={[0, 0, 0.006]}>
        <meshStandardMaterial color="#14131a" roughness={0.9} />
      </mesh>
      {/* Reflective pane */}
      <mesh geometry={glassGeo} position={[0, 0, 0.03]}>
        <meshStandardMaterial color="#e8eef4" metalness={0.92} roughness={0.08} envMapIntensity={1.4} />
      </mesh>
      {/* Matte black metal frame */}
      <mesh geometry={frameGeo} castShadow>
        <meshStandardMaterial color="#1a1a1f" metalness={0.55} roughness={0.42} />
      </mesh>
      {/* Contact shadow strip on the floor */}
      <mesh position={[0, 0.004, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.82, 0.22]} />
        <meshBasicMaterial color="#1a120b" transparent opacity={0.32} depthWrite={false} />
      </mesh>
    </group>
  );
}

function AcousticGuitar(props) {
  const BODY_DEPTH = 0.105;
  const SCALE_LEN = 0.648;          // nut → saddle
  const BRIDGE_Y = 0.135;
  const NUT_Y = BRIDGE_Y + SCALE_LEN; // 0.783
  const HEAD_LEN = 0.185;
  const TOP_Z = BODY_DEPTH / 2;

  const { bodyGeo, fretboardGeo, headGeo, pickguardGeo } = React.useMemo(() => {
    // Dreadnought outline (right half, mirrored)
    const half = [
      [0.13, 0.0, 0.205, 0.05, 0.2, 0.16],      // bottom → lower bout
      [0.198, 0.245, 0.165, 0.28, 0.125, 0.31],  // lower bout → waist
      [0.085, 0.34, 0.15, 0.36, 0.148, 0.43],    // waist → upper bout
      [0.146, 0.49, 0.085, 0.515, 0.0, 0.515],   // upper bout → top
    ];
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    half.forEach(([a, b, c, d, e, f]) => s.bezierCurveTo(a, b, c, d, e, f));
    [...half].reverse().forEach(([a, b, c, d, e, f], i) => {
      const prev = i === half.length - 1 ? [0, 0] : [half[half.length - 2 - i][4], half[half.length - 2 - i][5]];
      s.bezierCurveTo(-c, d, -a, b, -prev[0], prev[1]);
    });
    const hole = new THREE.Path();
    hole.absarc(0, 0.32, 0.05, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const bodyGeo = new THREE.ExtrudeGeometry(s, {
      depth: BODY_DEPTH, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4, curveSegments: 48,
    });
    bodyGeo.translate(0, 0, -BODY_DEPTH / 2);

    // Fretboard: slight taper, 0.043 at nut → 0.056 at body end
    const fb = new THREE.Shape();
    fb.moveTo(-0.0215, NUT_Y); fb.lineTo(0.0215, NUT_Y); fb.lineTo(0.028, 0.395); fb.lineTo(-0.028, 0.395); fb.closePath();
    const fretboardGeo = new THREE.ExtrudeGeometry(fb, { depth: 0.007, bevelEnabled: false });

    // Headstock silhouette
    const hs = new THREE.Shape();
    hs.moveTo(-0.023, 0); hs.lineTo(0.023, 0);
    hs.bezierCurveTo(0.045, 0.03, 0.045, 0.06, 0.04, 0.1);
    hs.lineTo(0.04, HEAD_LEN - 0.03); hs.bezierCurveTo(0.04, HEAD_LEN, 0.02, HEAD_LEN, 0, HEAD_LEN - 0.012);
    hs.bezierCurveTo(-0.02, HEAD_LEN, -0.04, HEAD_LEN, -0.04, HEAD_LEN - 0.03);
    hs.lineTo(-0.04, 0.1); hs.bezierCurveTo(-0.045, 0.06, -0.045, 0.03, -0.023, 0);
    const headGeo = new THREE.ExtrudeGeometry(hs, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 });

    // Pickguard (teardrop below soundhole, bass side)
    const pg = new THREE.Shape();
    pg.moveTo(0.06, 0.34); pg.bezierCurveTo(0.14, 0.34, 0.17, 0.26, 0.15, 0.2);
    pg.bezierCurveTo(0.13, 0.15, 0.08, 0.16, 0.06, 0.22); pg.bezierCurveTo(0.05, 0.27, 0.055, 0.3, 0.06, 0.34);
    const pickguardGeo = new THREE.ShapeGeometry(pg, 24);
    return { bodyGeo, fretboardGeo, headGeo, pickguardGeo };
  }, []);

  const mats = React.useMemo(() => {
    const top = new THREE.MeshStandardMaterial({ color: "#d9a35a", roughness: 0.38, envMapIntensity: 0.9 });
    const side = new THREE.MeshStandardMaterial({ color: "#5a2d12", roughness: 0.42, envMapIntensity: 0.9 });
    return [top, side];
  }, []);

  // Fret positions from nut (12-TET), keep those on the visible neck + first few over body
  const frets = React.useMemo(() => {
    const arr = [];
    for (let n = 1; n <= 20; n++) arr.push(NUT_Y - (SCALE_LEN - SCALE_LEN / Math.pow(2, n / 12)));
    return arr;
  }, []);
  const dotFrets = [3, 5, 7, 9, 12, 15, 17];

  // string x at nut / bridge
  const strX = (i, y) => {
    const tN = -0.0175 + i * 0.007; const tB = -0.026 + i * 0.0104;
    const k = (y - BRIDGE_Y) / SCALE_LEN;
    return tB + (tN - tB) * k;
  };

  return (
    <group {...props}>
      {/* Body: [0]=top/back face, [1]=sides */}
      <mesh geometry={bodyGeo} material={mats} castShadow receiveShadow />

      {/* Rosette rings */}
      {[0.056, 0.064].map((r, i) => (
        <mesh key={i} position={[0, 0.32, TOP_Z + 0.0005]}>
          <ringGeometry args={[r, r + 0.0035, 48]} />
          <meshStandardMaterial color={i === 0 ? "#1c1917" : "#7c4a1e"} roughness={0.5} />
        </mesh>
      ))}
      {/* Dark interior visible through hole */}
      <mesh position={[0, 0.32, -0.02]}>
        <circleGeometry args={[0.06, 32]} />
        <meshStandardMaterial color="#120b06" roughness={1} />
      </mesh>
      {/* Pickguard */}
      <mesh geometry={pickguardGeo} position={[0, 0, TOP_Z + 0.0008]}>
        <meshPhysicalMaterial color="#2a1a12" roughness={0.25} clearcoat={0.8} />
      </mesh>

      {/* Bridge + saddle + pins */}
      <group position={[0, BRIDGE_Y, TOP_Z + 0.004]}>
        <RoundedBox args={[0.155, 0.032, 0.009]} radius={0.004} smoothness={3}>
          <meshStandardMaterial color="#1a0f08" roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0.004, 0.006]}>
          <boxGeometry args={[0.075, 0.003, 0.006]} />
          <meshStandardMaterial color="#f5f0e6" roughness={0.3} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[-0.026 + i * 0.0104, -0.008, 0.006]}>
            <cylinderGeometry args={[0.003, 0.003, 0.004, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Neck (mahogany, D profile approximated) */}
      <mesh position={[0, (NUT_Y + 0.44) / 2, TOP_Z - 0.012]} castShadow>
        <boxGeometry args={[0.046, NUT_Y - 0.44, 0.024]} />
        <meshPhysicalMaterial color="#6b3a1e" roughness={0.35} clearcoat={0.6} />
      </mesh>
      {/* Heel */}
      <mesh position={[0, 0.47, TOP_Z - 0.04]}>
        <boxGeometry args={[0.046, 0.06, 0.06]} />
        <meshPhysicalMaterial color="#6b3a1e" roughness={0.35} clearcoat={0.6} />
      </mesh>
      {/* Fretboard (rosewood) */}
      <mesh geometry={fretboardGeo} position={[0, 0, TOP_Z]} castShadow>
        <meshStandardMaterial color="#2b1a10" roughness={0.45} />
      </mesh>
      {/* Frets */}
      {frets.map((fy, i) => (
        <mesh key={i} position={[0, fy, TOP_Z + 0.0075]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0008, 0.0008, 0.05 + (NUT_Y - fy) * 0.03, 8]} />
          <meshStandardMaterial color="#d8d8dc" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      {/* Inlay dots */}
      {dotFrets.map((n) => {
        const y = (frets[n - 1] + (n === 1 ? NUT_Y : frets[n - 2])) / 2;
        return n === 12 ? (
          [-0.012, 0.012].map((dx) => (
            <mesh key={`${n}${dx}`} position={[dx, y, TOP_Z + 0.0072]}>
              <circleGeometry args={[0.0035, 12]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.2} />
            </mesh>
          ))
        ) : (
          <mesh key={n} position={[0, y, TOP_Z + 0.0072]}>
            <circleGeometry args={[0.0035, 12]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.2} />
          </mesh>
        );
      })}
      {/* Nut */}
      <mesh position={[0, NUT_Y, TOP_Z + 0.008]}>
        <boxGeometry args={[0.044, 0.005, 0.008]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.3} />
      </mesh>

      {/* Headstock, tilted back 13° */}
      <group position={[0, NUT_Y, TOP_Z - 0.004]} rotation={[0.23, 0, 0]}>
        <mesh geometry={headGeo} castShadow>
          <meshPhysicalMaterial color="#2b1508" roughness={0.3} clearcoat={0.9} />
        </mesh>
        {/* Tuning machines: posts through head, buttons on the sides */}
        {[0, 1, 2].map((i) => [-1, 1].map((side) => (
          <group key={`${i}${side}`} position={[side * 0.022, 0.045 + i * 0.045, 0.008]}>
            <mesh>
              <cylinderGeometry args={[0.0035, 0.0035, 0.03, 12]} />
              <meshStandardMaterial color="#cfcfd4" metalness={0.95} roughness={0.2} />
            </mesh>
            <mesh position={[side * 0.02, 0, -0.012]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.005, 0.005, 0.014, 12]} />
              <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[side * 0.03, 0, -0.012]}>
              <sphereGeometry args={[0.007, 12, 12]} />
              <meshStandardMaterial color="#f4f4f5" roughness={0.35} metalness={0.7} />
            </mesh>
          </group>
        )))}
      </group>

      {/* 6 strings (wound bass strings slightly thicker) */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x0 = strX(i, BRIDGE_Y), x1 = strX(i, NUT_Y);
        const len = NUT_Y - BRIDGE_Y;
        const r = [0.0011, 0.0009, 0.0007, 0.0005, 0.0004, 0.00035][i];
        return (
          <mesh key={i} position={[(x0 + x1) / 2, BRIDGE_Y + len / 2, TOP_Z + 0.0125]} rotation={[0, 0, Math.atan2(x1 - x0, len)]}>
            <cylinderGeometry args={[r, r, len, 6]} />
            <meshStandardMaterial color={i < 3 ? "#b08d57" : "#d4d4d8"} metalness={0.9} roughness={0.3} />
          </mesh>
        );
      })}
      {/* Strap button */}
      <mesh position={[0, 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.004, 0.012, 10]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function GuitarOnStand(props) {
  const tube = (
    <meshStandardMaterial color="#1c1c1f" metalness={0.75} roughness={0.35} />
  );
  return (
    <group {...props}>
      {/* A-frame stand: two front legs, rear leg, cradle arms */}
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 0.16, 0.05]} rotation={[0.25, 0, x > 0 ? -0.35 : 0.35]}>
          <cylinderGeometry args={[0.007, 0.007, 0.36, 12]} />
          {tube}
        </mesh>
      ))}
      <mesh position={[0, 0.3, -0.16]} rotation={[-0.55, 0, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.7, 12]} />
        {tube}
      </mesh>
      {/* cross bar */}
      <mesh position={[0, 0.02, 0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.3, 12]} />
        {tube}
      </mesh>
      {/* cradle arms w/ foam */}
      {[-0.11, 0.11].map((x) => (
        <group key={x} position={[x, 0.085, 0.07]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.09, 10]} />
            {tube}
          </mesh>
          <mesh position={[0, 0.012, 0.04]}>
            <boxGeometry args={[0.03, 0.025, 0.03]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* neck yoke */}
      <mesh position={[0, 0.62, -0.02]}>
        <torusGeometry args={[0.032, 0.006, 8, 20, Math.PI]} />
        {tube}
      </mesh>

      {/* Guitar resting in cradle, leaning back ~14° */}
      <AcousticGuitar position={[0, 0.075, 0.075]} rotation={[-0.24, 0, 0]} />
      <mesh position={[0, 0.48, 0.02]} visible={false}>
        <boxGeometry args={[0.42, 1.05, 0.28]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function MonsteraLeaf3D({ scale = 1, rotation = [0, 0, 0], position = [0, 0, 0] }) {
  const shape = React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(-0.08, 0.05, -0.16, 0.12, -0.22, 0.25);
    s.bezierCurveTo(-0.20, 0.28, -0.12, 0.27, -0.08, 0.24);
    s.bezierCurveTo(-0.18, 0.35, -0.24, 0.48, -0.22, 0.62);
    s.bezierCurveTo(-0.14, 0.62, -0.10, 0.58, -0.06, 0.50);
    s.bezierCurveTo(-0.12, 0.65, -0.14, 0.80, -0.08, 0.95);
    s.bezierCurveTo(-0.04, 1.02, 0.00, 1.06, 0, 1.15);
    s.bezierCurveTo(0.04, 1.02, 0.08, 1.00, 0.12, 0.95);
    s.bezierCurveTo(0.18, 0.80, 0.16, 0.65, 0.10, 0.50);
    s.bezierCurveTo(0.14, 0.58, 0.18, 0.62, 0.26, 0.62);
    s.bezierCurveTo(0.28, 0.48, 0.22, 0.35, 0.12, 0.24);
    s.bezierCurveTo(0.16, 0.27, 0.24, 0.28, 0.26, 0.25);
    s.bezierCurveTo(0.20, 0.12, 0.12, 0.05, 0, 0);
    return s;
  }, []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, -0.30, 0]}>
        <cylinderGeometry args={[0.009, 0.014, 0.60, 16]} />
        <meshStandardMaterial color="#0d3d1a" roughness={0.5} envMapIntensity={1.3} />
      </mesh>

      {[0, 120, 240].map((ang, i) => (
        <group key={i} rotation={[0, (ang * Math.PI) / 180, 0]}>
          <mesh position={[0, 0.08 + i * 0.12, 0]} rotation={[0.25 + i * 0.1, 0, 0.1]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial
              color={i === 0 ? "#16a34a" : i === 1 ? "#15803d" : "#059669"}
              roughness={0.35}
              envMapIntensity={1.3}
              metalness={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.42, 0.055]} rotation={[0.35, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color="#15803d"
          roughness={0.3}
          envMapIntensity={1.3}
          metalness={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

const WINDOW = {
  x: -1.6,
  y: 2.14,
  z: -6.0,
  holeW: 2.66,
  holeH: 2.04,
};

/** White Venetian blinds sitting inside the sash */
function VenetianBlinds({ width = 2.34, height = 1.08, count = 30 }) {
  const meshRef = useRef();

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const step = height / count;
    const tilt = 0.58;
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, height / 2 - step * (i + 0.5), 0);
      dummy.rotation.set(tilt, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [height, count]);

  const slatMat = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f7f4ee",
        roughness: 0.38,
        metalness: 0.04,
        envMapIntensity: 0.5,
      }),
    []
  );
  const railMat = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#efece6",
        roughness: 0.44,
        metalness: 0.03,
        envMapIntensity: 0.4,
      }),
    []
  );

  return (
    <group>
      <mesh position={[0, height / 2 + 0.018, 0.01]} material={railMat}>
        <boxGeometry args={[width + 0.02, 0.042, 0.07]} />
      </mesh>
      <instancedMesh ref={meshRef} args={[null, null, count]} material={slatMat} frustumCulled={false}>
        <boxGeometry args={[width, 0.028, 0.012]} />
      </instancedMesh>
      <mesh position={[0, -height / 2 + 0.01, 0.008]} material={railMat}>
        <boxGeometry args={[width, 0.026, 0.04]} />
      </mesh>
      {[-width * 0.28, width * 0.28].map((x) => (
        <mesh key={x} position={[x, 0, 0.018]}>
          <boxGeometry args={[0.004, height - 0.03, 0.004]} />
          <meshStandardMaterial color="#d4d0c8" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function OutdoorTree({ position, scale = 1, color = "#6b9a42" }) {
  const highlight = "#98c96a";
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.032, 0.048, 0.32, 8]} />
        <meshBasicMaterial color="#5a3d28" />
      </mesh>
      <mesh position={[0, 0.42, 0]} scale={[1, 0.86, 1]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0.12, 0.38, 0.08]} scale={[1, 0.86, 1]}>
        <sphereGeometry args={[0.18, 14, 10]} />
        <meshBasicMaterial color={highlight} />
      </mesh>
      <mesh position={[-0.1, 0.36, -0.06]} scale={[1, 0.86, 1]}>
        <sphereGeometry args={[0.15, 14, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function NoRaycast({ children }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.traverse((obj) => {
      obj.raycast = () => {};
    });
  });
  return <group ref={ref}>{children}</group>;
}

function MiniOfficeDiorama({ position, textures, isPowerOff, isRadioPlaying }) {
  // Uniform 1:1 scale of the 13 × 3.8 × 13 room into the lower window pane.
  const s = 0.186;
  return (
    <NoRaycast>
      <group position={position}>
        <pointLight position={[0, 0.4, 0.2]} color="#fff3dd" intensity={1.85} distance={2.8} decay={2} />
        <group scale={s} position={[0, 0, -6 * s]}>
          <OfficeInterior
            variant="miniature"
            isPowerOff={isPowerOff}
            isRadioPlaying={isRadioPlaying}
            hovered={null}
            textures={textures}
          />
        </group>
      </group>
    </NoRaycast>
  );
}

function OutdoorWindowWorld({
  width,
  height,
  depth = 2.52,
  skyMap,
  isPowerOff,
  textures,
  isRadioPlaying,
}) {
  const w = width;
  const h = height;
  const d = depth;
  const sky = isPowerOff ? "#0b0d12" : "#d4e4ef";
  const ground = isPowerOff ? "#0b0d12" : "#3d2918";
  const gy = -h / 2 + 0.002;

  return (
    <group>
      <mesh position={[0, 0, -d]}>
        <planeGeometry args={[w, h]} />
        {isPowerOff || !skyMap ? (
          <meshBasicMaterial color="#08090d" />
        ) : (
          <meshBasicMaterial map={skyMap} />
        )}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, gy, -d / 2]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color={ground} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h / 2 - 0.002, -d / 2]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color={sky} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-w / 2 + 0.002, 0, -d / 2]}>
        <planeGeometry args={[d, h]} />
        <meshBasicMaterial color={sky} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[w / 2 - 0.002, 0, -d / 2]}>
        <planeGeometry args={[d, h]} />
        <meshBasicMaterial color={sky} />
      </mesh>
      {!isPowerOff && (
        <MiniOfficeDiorama
          position={[0, gy + 0.004, -0.12]}
          textures={textures}
          isPowerOff={isPowerOff}
          isRadioPlaying={isRadioPlaying}
        />
      )}
    </group>
  );
}

function WindowOpening({ isPowerOff, textures, isRadioPlaying, includeOutdoor = true }) {
  const { walnutTex, oakFrameTex, windowViewTex } = textures;
  const glassW = 2.42;
  const glassH = 1.82;
  const casing = 0.08;
  const sash = 0.055;
  const blindsH = 1.12;
  const cream = isPowerOff ? "#2a241c" : "#e8e0d4";
  const white = isPowerOff ? "#3a342c" : "#f3f0ea";

  return (
    <group position={[WINDOW.x, WINDOW.y, WINDOW.z]}>
      {includeOutdoor && (
      <OutdoorWindowWorld
        width={WINDOW.holeW - 0.06}
        height={WINDOW.holeH - 0.06}
        depth={2.52}
        skyMap={windowViewTex}
        isPowerOff={isPowerOff}
        textures={textures}
        isRadioPlaying={isRadioPlaying}
      />
      )}

      {/* Painted reveal inside the wall thickness */}
      {[
        [-WINDOW.holeW / 2 + 0.025, 0, 0, 0.05, WINDOW.holeH, 0.16],
        [WINDOW.holeW / 2 - 0.025, 0, 0, 0.05, WINDOW.holeH, 0.16],
        [0, WINDOW.holeH / 2 - 0.025, 0, WINDOW.holeW, 0.05, 0.16],
        [0, -WINDOW.holeH / 2 + 0.025, 0, WINDOW.holeW, 0.05, 0.16],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`reveal-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={cream} roughness={0.78} envMapIntensity={0.35} />
        </mesh>
      ))}

      {/* Room-side wood casing */}
      {[
        [-(glassW / 2 + casing / 2 + sash * 0.2), 0, 0.09, casing, glassH + casing * 2 + 0.08, 0.06],
        [glassW / 2 + casing / 2 + sash * 0.2, 0, 0.09, casing, glassH + casing * 2 + 0.08, 0.06],
        [0, glassH / 2 + casing / 2 + 0.04, 0.09, glassW + casing * 2 + 0.04, casing, 0.06],
        [0, -glassH / 2 - casing / 2 - 0.02, 0.1, glassW + casing * 2 + 0.12, casing + 0.02, 0.14],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`casing-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            map={walnutTex}
            color={isPowerOff ? "#1a1208" : "#5c3820"}
            roughness={0.42}
            metalness={0.04}
            envMapIntensity={1}
          />
        </mesh>
      ))}

      {/* White inner sash */}
      {[
        [-(glassW / 2 + sash / 2), 0, 0.055, sash, glassH + sash, 0.05],
        [glassW / 2 + sash / 2, 0, 0.055, sash, glassH + sash, 0.05],
        [0, glassH / 2 + sash / 2, 0.055, glassW + sash * 2, sash, 0.05],
        [0, -glassH / 2 - sash / 2, 0.055, glassW + sash * 2, sash, 0.05],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`sash-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={white} roughness={0.42} metalness={0.03} envMapIntensity={0.55} />
        </mesh>
      ))}

      {/* Vertical mullion + meeting rail */}
      <mesh position={[0, 0, 0.058]}>
        <boxGeometry args={[0.048, glassH, 0.04]} />
        <meshStandardMaterial color={white} roughness={0.42} metalness={0.03} envMapIntensity={0.55} />
      </mesh>
      <mesh position={[0, glassH / 2 - blindsH - 0.02, 0.058]}>
        <boxGeometry args={[glassW, 0.045, 0.04]} />
        <meshStandardMaterial color={white} roughness={0.42} metalness={0.03} envMapIntensity={0.55} />
      </mesh>

      {/* Thin glass sheen */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[glassW, glassH]} />
        <meshStandardMaterial
          color={isPowerOff ? "#1a2438" : "#ffffff"}
          transparent
          opacity={isPowerOff ? 0.5 : 0.06}
          roughness={0.04}
          metalness={0}
          envMapIntensity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Oak sill projecting into the room */}
      <RoundedBox args={[glassW + 0.36, 0.055, 0.22]} radius={0.01} smoothness={3} position={[0, -glassH / 2 - 0.06, 0.16]}>
        <meshStandardMaterial
          map={oakFrameTex}
          color={isPowerOff ? "#3d2818" : "#8d5b36"}
          roughness={0.36}
          metalness={0.03}
          envMapIntensity={1}
        />
      </RoundedBox>

      <group position={[0, glassH / 2 - blindsH / 2 - 0.02, 0.072]}>
        <VenetianBlinds width={glassW - 0.04} height={blindsH} count={32} />
      </group>
    </group>
  );
}

export function OfficeEnvironment() {
  const isPowerOff = useOfficeStore((s) => s.isPowerOff);
  const isRadioPlaying = useOfficeStore((s) => s.isRadioPlaying);
  const hovered = useOfficeStore((s) => s.hoveredObject);

  const radioAnimRef = useRef();
  const emergencyLightRef = useRef();
  const vinylRef = useRef();

  useEffect(() => {
    Object.values(OFFICE_FONTS).forEach((font) => {
      preloadFont({ font }, () => {});
    });
  }, []);

  // Load procedural textures
  const woodFloorTex = React.useMemo(() => getWoodFloorTexture(), []);
  const woodFloorNormal = React.useMemo(() => getWoodFloorNormalMap(), []);
  const rugTex = React.useMemo(() => getRugTexture(), []);
  const rugNormal = React.useMemo(() => getRugNormalMap(), []);
  const deskRugTex = React.useMemo(() => getDeskRugTexture(), []);
  const marbleTex = React.useMemo(() => getMarbleTexture(), []);
  const marbleNormal = React.useMemo(() => getMarbleNormalMap(), []);
  const mainScreenTex = React.useMemo(() => getMainScreenTexture(), []);
  const verticalScreenTex = React.useMemo(() => getVerticalScreenTexture(), []);
  const corkTex = React.useMemo(() => makeCorkTexture(), []);
  const walnutTex = React.useMemo(() => makeWoodTexture("#5a3418", "#2a1608", [2, 1]), []);
  const oakFrameTex = React.useMemo(() => makeWoodTexture("#8d5b36", "#4d2f18", [3, 1]), []);
  const poster2Tex = React.useMemo(() => getArtPosterTexture(1), []);
  const radioGrilleTex = React.useMemo(() => getRadioGrilleTexture(), []);
  const windowViewTex = React.useMemo(() => getWindowViewTexture(), []);
  const bookSpineTex = React.useMemo(() => getBookSpineTexture(), []);
  const bookSpineNormal = React.useMemo(() => getBookSpineNormalMap(), []);
  const magazineTex = React.useMemo(() => {
    const t = new THREE.TextureLoader().load("/textures/magazine.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const vinylCoverTex = React.useMemo(() => {
    const t = new THREE.TextureLoader().load("/textures/vinyl_cover.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const keyboardTex = React.useMemo(() => {
    const t = new THREE.TextureLoader().load("/textures/keyboard.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const tabletUiTex = React.useMemo(() => {
    const t = new THREE.TextureLoader().load("/textures/tablet_ui.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const projectLogoTex = React.useMemo(() => {
    const t = new THREE.TextureLoader().load("/oppos-logo-sign.png");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  const alonTex = React.useMemo(() => {
    const t = new THREE.TextureLoader().load("/alon.jpeg");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }, []);

  const textures = {
    woodFloorTex,
    woodFloorNormal,
    rugTex,
    rugNormal,
    deskRugTex,
    marbleTex,
    marbleNormal,
    mainScreenTex,
    verticalScreenTex,
    corkTex,
    walnutTex,
    oakFrameTex,
    poster2Tex,
    radioGrilleTex,
    windowViewTex,
    bookSpineTex,
    bookSpineNormal,
    magazineTex,
    vinylCoverTex,
    keyboardTex,
    tabletUiTex,
    projectLogoTex,
    alonTex,
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (radioAnimRef.current && isRadioPlaying) {
      radioAnimRef.current.scale.y = 1 + Math.sin(t * 8) * 0.4 + Math.cos(t * 12) * 0.2;
    }

    if (vinylRef.current) {
      vinylRef.current.rotation.y += isRadioPlaying ? 0.05 : 0.015;
    }

    // Emergency red strobe when power is tripped
    if (emergencyLightRef.current) {
      if (isPowerOff) {
        emergencyLightRef.current.intensity = Math.sin(t * 10) > 0 ? 2.8 : 0.3;
      } else {
        emergencyLightRef.current.intensity = 0;
      }
    }
  });


  return (
    <group name="Cozy_Designer_Bedroom">
      {!isPowerOff && (
        <Environment preset="apartment" environmentIntensity={0.42} />
      )}
      <hemisphereLight
        intensity={isPowerOff ? 0.08 : 0.85}
        color={isPowerOff ? "#1a2e4a" : "#fff8eb"}
        groundColor={isPowerOff ? "#0a1220" : "#c4a574"}
      />
      <ambientLight
        intensity={isPowerOff ? 0.04 : 0.42}
        color={isPowerOff ? "#1a2e4a" : "#fffbf2"}
      />
      <directionalLight
        position={[-5, 9, -7]}
        intensity={isPowerOff ? 0.04 : 1.45}
        color={isPowerOff ? "#38bdf8" : "#fffbeb"}
      />
      {!isPowerOff && (
        <>
          <pointLight position={[0, 3.15, 0]} color="#fed7aa" intensity={1.15} distance={10} decay={2} />
          <pointLight position={[-4.6, 1.25, -1.2]} color="#fda4af" intensity={1.15} distance={4.2} decay={2} />
          <pointLight position={[0.25, 1.45, -1.75]} color="#fef3c7" intensity={1.35} distance={4.4} decay={2} />
          <pointLight position={[1.2, 1.15, -2.45]} color="#a78bfa" intensity={0.55} distance={3.2} decay={2} />
          <pointLight position={[4.72, 2.12, 5.28]} color="#fef08a" intensity={0.7} distance={3.6} decay={2} />
          <pointLight position={[-1.6, 2.2, -5.45]} color="#eaf2ff" intensity={1.9} distance={6.8} decay={2} />
        </>
      )}
      <pointLight
        ref={emergencyLightRef}
        position={[3.8, 1.2, -5.5]}
        distance={10}
        color="#ef4444"
        intensity={0}
      />
      <ContactShadows
        position={[0, 0.006, 0]}
        opacity={0.42}
        scale={13}
        blur={2.4}
        far={3.2}
        resolution={384}
        frames={1}
        color="#3d2817"
      />

      <OfficeInterior
        variant="live"
        isPowerOff={isPowerOff}
        isRadioPlaying={isRadioPlaying}
        hovered={hovered}
        radioAnimRef={radioAnimRef}
        vinylRef={vinylRef}
        textures={textures}
      />
    </group>
  );
}

function OfficeInterior({
  variant = "live",
  isPowerOff,
  isRadioPlaying,
  hovered,
  radioAnimRef,
  vinylRef,
  textures,
}) {
  const isLive = variant === "live";
  const {
    woodFloorTex,
    woodFloorNormal,
    rugTex,
    rugNormal,
    deskRugTex,
    marbleTex,
    marbleNormal,
    mainScreenTex,
    verticalScreenTex,
    corkTex,
    walnutTex,
    oakFrameTex,
    poster2Tex,
    radioGrilleTex,
    windowViewTex,
    bookSpineTex,
    bookSpineNormal,
    magazineTex,
    vinylCoverTex,
    keyboardTex,
    tabletUiTex,
    projectLogoTex,
    alonTex,
  } = textures;
  const interactName = (n) => (isLive ? n : undefined);
  const interactData = (type) => (isLive ? { isInteractable: true, type } : undefined);

  return (
    <group>
      {!isLive && !isPowerOff && (
        <>
          <pointLight position={[0, 3.15, 0]} color="#fed7aa" intensity={1.15} distance={10} decay={2} />
          <pointLight position={[-4.6, 1.25, -1.2]} color="#fda4af" intensity={1.15} distance={4.2} decay={2} />
          <pointLight position={[0.25, 1.45, -1.75]} color="#fef3c7" intensity={1.35} distance={4.4} decay={2} />
          <pointLight position={[1.2, 1.15, -2.45]} color="#a78bfa" intensity={0.55} distance={3.2} decay={2} />
          <pointLight position={[4.72, 2.12, 5.28]} color="#fef08a" intensity={0.7} distance={3.6} decay={2} />
          <pointLight position={[-1.6, 2.2, -5.45]} color="#eaf2ff" intensity={1.35} distance={6.8} decay={2} />
          <hemisphereLight intensity={0.7} color="#fff8eb" groundColor="#c4a574" />
        </>
      )}
      {/* ── ROOM ARCHITECTURE ── */}
      {/* Warm Natural Oak Plank Floor with Texture & Normal Detail */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} castShadow receiveShadow>
        <planeGeometry args={[13, 13]} />
        <meshStandardMaterial
          map={woodFloorTex}
          normalMap={woodFloorNormal}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          roughness={0.35}
          metalness={0.05}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* High-End Designer Abstract Geometric Area Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.45, 0.012, 3.85]} receiveShadow>
        <planeGeometry args={[3.5, 3.0]} />
        <meshStandardMaterial
          map={rugTex}
          normalMap={rugNormal}
          normalScale={new THREE.Vector2(1.0, 1.0)}
          roughness={0.8}
          metalness={0}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Desk workstation rug — indigo flat-weave under desk & chair */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.35, 0.013, -1.72]} receiveShadow>
        <planeGeometry args={[3.35, 2.75]} />
        <meshStandardMaterial
          map={deskRugTex}
          normalMap={rugNormal}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          roughness={0.88}
          metalness={0}
          envMapIntensity={0.65}
        />
      </mesh>

      {/* Warm plaster ceiling — lighter tone, same palette as oak walls */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.8, 0]}>
        <planeGeometry args={[13, 13]} />
        <meshStandardMaterial
          color={isPowerOff ? "#1e1812" : "#d9cdb8"}
          roughness={0.92}
          metalness={0.01}
          envMapIntensity={0.85}
        />
      </mesh>

      {/* ── EXPOSED JAPANDI WOODEN CEILING BEAMS ── */}
      {[-4.0, -1.5, 1.0, 3.5].map((bz, idx) => (
        <group key={`beam_${idx}`} position={[0, 3.7, bz]}>
          {/* Main Solid Oak Beam */}
          <RoundedBox args={[12.2, 0.18, 0.22]} radius={0.015} smoothness={2}>
            <meshStandardMaterial color="#8a5a36" roughness={0.4} envMapIntensity={1.2} />
          </RoundedBox>
          {/* Matte Black Iron Beam Mount Brackets at ends */}
          <mesh position={[-5.95, 0, 0]}>
            <boxGeometry args={[0.06, 0.22, 0.26]} />
            <meshStandardMaterial color="#1f242d" metalness={0.8} roughness={0.3} envMapIntensity={1.2} />
          </mesh>
          <mesh position={[5.95, 0, 0]}>
            <boxGeometry args={[0.06, 0.22, 0.26]} />
            <meshStandardMaterial color="#1f242d" metalness={0.8} roughness={0.3} envMapIntensity={1.2} />
          </mesh>
        </group>
      ))}

      {/* Modern Track Spotlight Fixtures mounted on Beams */}
      <group position={[1.4, 3.58, -1.5]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.0, 0.04, 0.04]} />
          <meshStandardMaterial color="#18181b" metalness={0.8} />
        </mesh>
        {[-0.6, 0.6].map((sx, i) => (
          <group key={i} position={[sx, -0.08, 0]} rotation={[0.3, -0.2, 0]}>
            <cylinderGeometry args={[0.035, 0.05, 0.1, 16]} />
            <meshStandardMaterial color="#18181b" metalness={0.7} />
          </group>
        ))}
      </group>

      {/* Modern Ceiling Hanging Pendant Fixture */}
      <group position={[0, 3.8, 0]}>
        {/* Cord */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.8]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        {/* Scandinavian Wood/Paper Shade */}
        <mesh position={[0, -0.9, 0]}>
          <cylinderGeometry args={[0.22, 0.38, 0.35, 24]} />
          <meshStandardMaterial
            color={isPowerOff ? "#334155" : "#fef3c7"}
            roughness={0.6} envMapIntensity={1.2}
            emissive={isPowerOff ? "#000000" : "#f59e0b"}
            emissiveIntensity={isPowerOff ? 0 : 0.4}
          />
        </mesh>
      </group>

      {/* Room Walls — miniature omits the south wall so you look into the replica */}
      {[
        { id: "south", pos: [0, 1.9, 6.0], rot: null },
        { id: "west", pos: [-6.0, 1.9, 0], rot: [0, Math.PI / 2, 0] },
        { id: "east", pos: [6.0, 1.9, 0], rot: [0, -Math.PI / 2, 0] },
      ].filter((w) => isLive || w.id !== "south").map(({ pos, rot, id }) => (
        <mesh key={`wall-${id}`} position={pos} rotation={rot ?? [0, 0, 0]} receiveShadow>
          <boxGeometry args={[13, 3.8, 0.15]} />
          <meshStandardMaterial
            map={isPowerOff ? null : oakFrameTex}
            color={isPowerOff ? "#0f172a" : "#7c5332"}
            roughness={0.48}
            metalness={0.02}
            envMapIntensity={1.0}
          />
        </mesh>
      ))}
      {(() => {
        const holeX0 = WINDOW.x - WINDOW.holeW / 2;
        const holeX1 = WINDOW.x + WINDOW.holeW / 2;
        const holeY0 = WINDOW.y - WINDOW.holeH / 2;
        const holeY1 = WINDOW.y + WINDOW.holeH / 2;
        const wallMat = {
          map: isPowerOff ? null : oakFrameTex,
          color: isPowerOff ? "#0f172a" : "#7c5332",
          roughness: 0.48,
          metalness: 0.02,
          envMapIntensity: 1.0,
        };
        const pieces = [
          { pos: [(-6.5 + holeX0) / 2, 1.9, WINDOW.z], size: [holeX0 - -6.5, 3.8, 0.15] },
          { pos: [(holeX1 + 6.5) / 2, 1.9, WINDOW.z], size: [6.5 - holeX1, 3.8, 0.15] },
          { pos: [WINDOW.x, (holeY1 + 3.8) / 2, WINDOW.z], size: [WINDOW.holeW, 3.8 - holeY1, 0.15] },
          { pos: [WINDOW.x, holeY0 / 2, WINDOW.z], size: [WINDOW.holeW, holeY0, 0.15] },
        ];
        return pieces.map((p, i) => (
          <mesh key={`north-wall-${i}`} position={p.pos} receiveShadow>
            <boxGeometry args={p.size} />
            <meshStandardMaterial {...wallMat} />
          </mesh>
        ));
      })()}

      {/* ── WEST WALL vertical slat detail (on top of matching wood walls) ── */}
      <group position={[-5.88, 1.92, -1.75]} rotation={[0, Math.PI / 2, 0]}>
        {Array.from({ length: 50 }).map((_, i) => (
          <mesh key={i} position={[-1.05 + i * 0.124, 0, 0.012]}>
            <boxGeometry args={[0.052, 3.55, 0.024]} />
            <meshStandardMaterial color="#7c5332" roughness={0.42} envMapIntensity={1.1} />
          </mesh>
        ))}
      </group>

      {/* Baseboard moulding — darker walnut trim (complements wall oak) */}
      {[
        { id: "north", pos: [0, 0.09, -5.92], rot: null },
        { id: "south", pos: [0, 0.09, 5.92], rot: null },
        { id: "west", pos: [-5.92, 0.09, 0], rot: [0, Math.PI / 2, 0] },
        { id: "east", pos: [5.92, 0.09, 0], rot: [0, -Math.PI / 2, 0] },
      ].filter((b) => isLive || b.id !== "south").map(({ pos, rot, id }) => (
        <mesh key={`baseboard-${id}`} position={pos} rotation={rot ?? [0, 0, 0]}>
          <boxGeometry args={[12.8, 0.18, 0.04]} />
          <meshStandardMaterial
            map={isPowerOff ? null : walnutTex}
            color={isPowerOff ? "#1a1208" : "#5a3820"}
            roughness={0.55}
            metalness={0.03}
            envMapIntensity={0.9}
          />
        </mesh>
      ))}

      {/* ── WINDOW — real opening, white sash, blinds, outdoor view ── */}
      <WindowOpening
        isPowerOff={isPowerOff}
        textures={textures}
        isRadioPlaying={isRadioPlaying}
        includeOutdoor={isLive}
      />

      {/* ── PREMIUM PLATFORM BED — Professional GLB Model ── */}
      <group
        name={interactName("interactable_bed")}
        userData={interactData("bed")}
        position={[-4.5, 0, -4.1]}
      >
        <BedModel scale={1.9} />
        <mesh position={[0, 0.48, 0.15]} visible={false}>
          <boxGeometry args={[2.5, 0.95, 2.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* ── HIGH-END STUDY & WORKSTATION SETUP ── */}
      <group position={[1.4, 0, -1.8]}>
        {/* Light Oak Curved Work Desk with Bevelled Edge */}
        <RoundedBox args={[2.7, 0.06, 1.25]} radius={0.02} smoothness={4} position={[0, 0.82, 0]}>
          <meshStandardMaterial color="#d4a373" roughness={0.35} envMapIntensity={1.2} metalness={0.05} />
        </RoundedBox>

        {/* Desk Rear Wall-Wash Ambient LED Strip */}
        <mesh position={[0, 0.81, -0.61]}>
          <boxGeometry args={[2.6, 0.015, 0.015]} />
          <meshBasicMaterial color={isPowerOff ? "#1e293b" : "#818cf8"} />
        </mesh>

        {/* Architectural Matte-Black Steel Trestle Frames with Brass Glides */}
        {[-1.22, 1.22].map((x, frameIdx) => (
          <group key={frameIdx} position={[x, 0, 0]}>
            {/* Front and Back Upright Posts */}
            {[-0.45, 0.45].map((z, postIdx) => (
              <mesh key={postIdx} position={[0, 0.41, z]}>
                <boxGeometry args={[0.045, 0.81, 0.045]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} envMapIntensity={1.2} />
              </mesh>
            ))}
            {/* Bottom Floor Stretcher */}
            <mesh position={[0, 0.025, 0]}>
              <boxGeometry args={[0.045, 0.045, 1.0]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} envMapIntensity={1.2} />
            </mesh>
            {/* Top Under-Desk Support Rail */}
            <mesh position={[0, 0.79, 0]}>
              <boxGeometry args={[0.045, 0.035, 0.95]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} envMapIntensity={1.2} />
            </mesh>
            {/* Brushed Brass Floor Glides */}
            {[-0.45, 0.45].map((z, glideIdx) => (
              <mesh key={glideIdx} position={[0, 0.006, z]}>
                <cylinderGeometry args={[0.024, 0.024, 0.012, 16]} />
                <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} envMapIntensity={1.2} />
              </mesh>
            ))}
          </group>
        ))}

        {/* ── HIGH-BACK RACING GAMING CHAIR — GLB ── */}
        <GamingChairModel position={[0.1, 0, 0.85]} rotation={[0, Math.PI, 0]} />

        {/* ═══ INTERACTIVE: MAIN ULTRAWIDE WORKSTATION (DEV TERMINAL) ═══ */}
        <group
          name={interactName("interactable_screen")}
          userData={interactData("screen")}
          position={[-0.2, 0.85, -0.15]}
        >
          {/* Heavy Metal Monitor Stand */}
          <mesh position={[0, 0.14, -0.12]}>
            <cylinderGeometry args={[0.025, 0.025, 0.28]} />
            <meshStandardMaterial color="#4b5563" metalness={0.85} />
          </mesh>
          <RoundedBox args={[0.35, 0.02, 0.22]} radius={0.01} smoothness={2} position={[0, 0.015, -0.12]}>
            <meshStandardMaterial color="#1f2937" metalness={0.8} />
          </RoundedBox>

          {/* Curved Ultrawide Display Frame */}
          <RoundedBox args={[1.5, 0.58, 0.05]} radius={0.02} smoothness={4} position={[0, 0.45, 0]}>
            <meshStandardMaterial
              color={hovered?.type === "screen" ? "#38bdf8" : "#111827"}
              roughness={0.3} envMapIntensity={1.2}
              metalness={0.4}
            />
          </RoundedBox>

          {/* Active Display Panel with Procedural Code IDE Texture */}
          <mesh position={[0, 0.45, 0.028]}>
            <planeGeometry args={[1.45, 0.53]} />
            <meshBasicMaterial
              map={isPowerOff ? null : mainScreenTex}
              color={isPowerOff ? "#030712" : "#ffffff"}
            />
          </mesh>
          {!isPowerOff && (
            <mesh position={[0, 0.45, 0.12]}>
              <planeGeometry args={[1.7, 0.72]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.07} depthWrite={false} />
            </mesh>
          )}

        </group>

        {/* ═══ INTERACTIVE OBJECT: SOLANA REWARDS VAULT LEDGER ═══ */}
        <group
          name={interactName("interactable_rewards")}
          userData={interactData("rewards")}
          position={[0.42, 0.85, 0.12]}
          rotation={[0, -0.2, 0]}
        >
          {/* Futuristic Gold Metallic Ledger / Safe */}
          <RoundedBox args={[0.26, 0.08, 0.22]} radius={0.015} smoothness={4} position={[0, 0.04, 0]}>
            <meshStandardMaterial
              color={hovered?.type === "rewards" ? "#fbbf24" : "#d97706"}
              metalness={0.9}
              roughness={0.2} envMapIntensity={1.2}
            />
          </RoundedBox>
          {/* Glowing Holographic Core */}
          <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.07, 24]} />
            <meshBasicMaterial color={isPowerOff ? "#334155" : "#10b981"} />
          </mesh>
        </group>

        {/* INTERACTIVE: PORTRAIT MONITOR (MINT PASS TERMINAL) */}
        <group
          name={interactName("interactable_mint")}
          userData={interactData("mint")}
          position={[-1.05, 0.85, -0.05]}
          rotation={[0, 0.35, 0]}
        >
          <RoundedBox args={[0.42, 0.72, 0.04]} radius={0.015} smoothness={4} position={[0, 0.48, 0]}>
            <meshStandardMaterial
              color={hovered?.type === "mint" ? "#38bdf8" : "#111827"}
              roughness={0.3}
              envMapIntensity={1.2}
            />
          </RoundedBox>
          <mesh position={[0, 0.48, 0.023]}>
            <planeGeometry args={[0.39, 0.68]} />
            <meshBasicMaterial
              map={isPowerOff ? null : verticalScreenTex}
              color={isPowerOff ? "#030712" : "#ffffff"}
            />
          </mesh>
          {/* Stand */}
          <mesh position={[0, 0.12, -0.08]}>
            <cylinderGeometry args={[0.02, 0.02, 0.24]} />
            <meshStandardMaterial color="#374151" metalness={0.8} />
          </mesh>
        </group>


        {/* STUDIO AUDIO MONITORS (Bookshelf Speakers with iconic cones) */}
        {/* Left Speaker */}
        <group position={[-0.88, 0.85, 0.3]} rotation={[0, 0.3, 0]}>
          <RoundedBox args={[0.18, 0.28, 0.18]} radius={0.015} smoothness={4} position={[0, 0.14, 0]}>
            <meshStandardMaterial color="#18181b" roughness={0.4} envMapIntensity={1.2} />
          </RoundedBox>
          {/* Yellow Woofer Cone */}
          <mesh position={[0, 0.1, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.05, 20]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} envMapIntensity={1.2} />
          </mesh>
          {/* Tweeter */}
          <mesh position={[0, 0.2, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.02, 16]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
        </group>
        {/* Right Speaker */}
        <group position={[0.72, 0.85, 0.25]} rotation={[0, -0.25, 0]}>
          <RoundedBox args={[0.18, 0.28, 0.18]} radius={0.015} smoothness={4} position={[0, 0.14, 0]}>
            <meshStandardMaterial color="#18181b" roughness={0.4} envMapIntensity={1.2} />
          </RoundedBox>
          <mesh position={[0, 0.1, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.05, 20]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} envMapIntensity={1.2} />
          </mesh>
          <mesh position={[0, 0.2, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.02, 16]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
        </group>

        {/* ═══ INTERACTIVE OBJECT 2: VINTAGE RETRO WOODEN RADIO ═══ */}
        <group
          name={interactName("interactable_radio")}
          userData={interactData("radio")}
          position={[0.72, 1.15, 0.25]}
          rotation={[0, -0.25, 0]}
        >
          {/* Wood Radio Case with Rounded Edges */}
          <RoundedBox args={[0.34, 0.2, 0.16]} radius={0.025} smoothness={4} position={[0, 0.1, 0]}>
            <meshStandardMaterial
              color={hovered?.type === "radio" ? "#22c55e" : "#854d0e"}
              roughness={0.35} envMapIntensity={1.2}
            />
          </RoundedBox>

          {/* Textured Tweed Fabric Grille */}
          <mesh position={[-0.07, 0.1, 0.082]}>
            <planeGeometry args={[0.14, 0.14]} />
            <meshStandardMaterial map={radioGrilleTex} roughness={0.7} envMapIntensity={1.2} />
          </mesh>

          {/* Tuning Frequency Dial */}
          <mesh position={[0.08, 0.12, 0.082]}>
            <planeGeometry args={[0.12, 0.06]} />
            <meshBasicMaterial color={isRadioPlaying ? "#4ade80" : "#e4e4e7"} />
          </mesh>

          {/* Polished Brass Knobs */}
          <mesh position={[0.08, 0.05, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.02, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} envMapIntensity={1.2} />
          </mesh>

          {/* Telescopic Antenna */}
          <mesh position={[-0.12, 0.27, -0.04]} rotation={[0, 0, -0.15]}>
            <cylinderGeometry args={[0.004, 0.004, 0.26]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.95} />
          </mesh>

          {/* Animated Equalizer Wave Bars */}
          {isRadioPlaying && (
            <group ref={isLive ? radioAnimRef : undefined} position={[0, 0.27, 0]}>
              <mesh position={[-0.03, 0, 0]}>
                <boxGeometry args={[0.015, 0.08, 0.015]} />
                <meshBasicMaterial color="#22c55e" />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.015, 0.13, 0.015]} />
                <meshBasicMaterial color="#4ade80" />
              </mesh>
              <mesh position={[0.03, 0, 0]}>
                <boxGeometry args={[0.015, 0.07, 0.015]} />
                <meshBasicMaterial color="#22c55e" />
              </mesh>
            </group>
          )}
        </group>

        {/* Desk Accessories: Keyboard, Mousepad, Coffee Mug, Headphone Stand */}
        {/* Felt Desk Mat */}
        <RoundedBox args={[0.85, 0.008, 0.38]} radius={0.01} smoothness={2} position={[-0.15, 0.855, 0.2]}>
          <meshStandardMaterial color="#1e293b" roughness={0.8} envMapIntensity={1.2} />
        </RoundedBox>
        {/* Custom 75% Mechanical Keyboard with PBT Keycaps */}
        <group position={[-0.2, 0.866, 0.22]}>
          {/* CNC Anodized Aluminum Chassis */}
          <RoundedBox args={[0.38, 0.016, 0.14]} radius={0.008} smoothness={2}>
            <meshStandardMaterial color="#1e242d" metalness={0.7} roughness={0.3} envMapIntensity={1.2} />
          </RoundedBox>
          {/* High-Resolution Printed Keycap Surface */}
          <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.365, 0.128]} />
            <meshStandardMaterial map={keyboardTex} roughness={0.35} envMapIntensity={1.2} />
          </mesh>
        </group>

        {/* Ergonomic Wireless Mouse with Illuminated Scroll Wheel */}
        <group position={[0.15, 0.865, 0.22]}>
          <RoundedBox args={[0.065, 0.022, 0.105]} radius={0.015} smoothness={4}>
            <meshStandardMaterial color="#0f172a" roughness={0.3} envMapIntensity={1.2} metalness={0.2} />
          </RoundedBox>
          {/* Glowing Cyan Scroll Wheel */}
          <mesh position={[0, 0.012, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.008, 32]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* Ceramic Mug */}
        <mesh position={[0.42, 0.89, 0.28]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} envMapIntensity={1.2} />
        </mesh>

        {/* Minimalist Headphone Stand with Studio Headphones */}
        <group position={[-0.72, 0.86, 0.2]}>
          {/* Base & Aluminum Pole */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.015, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.26]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} envMapIntensity={1.2} />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <boxGeometry args={[0.07, 0.015, 0.04]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Headphone Band & Earcups */}
          <group position={[0, 0.22, 0]}>
            <mesh position={[-0.04, -0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} envMapIntensity={1.2} />
            </mesh>
            <mesh position={[0.04, -0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} envMapIntensity={1.2} />
            </mesh>
          </group>
        </group>

        {/* Mini Potted Desk Succulent */}
        <group position={[0.55, 0.86, -0.2]}>
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.04, 0.03, 0.07, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} envMapIntensity={1.2} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} envMapIntensity={1.2} />
          </mesh>
        </group>

        {/* Gaming PC tower — on desk, right of radio */}
        <group position={[1.05, 0.82, 0.2]} rotation={[0, -0.3, 0]} scale={0.88}>
          {/* Case outer shell — matte black aluminium */}
          <RoundedBox args={[0.22, 0.52, 0.46]} radius={0.018} smoothness={5} position={[0, 0.26, 0]}>
            <meshStandardMaterial color="#0a0a0f" roughness={0.18} envMapIntensity={1.2} metalness={0.62} />
          </RoundedBox>

          {/* Front bezel frame */}
          <mesh position={[0.108, 0.26, 0]}>
            <boxGeometry args={[0.008, 0.48, 0.42]} />
            <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.8} envMapIntensity={1.2} />
          </mesh>

          {/* Front ventilation grilles (mesh pattern) */}
          {[0.15, 0.02, -0.11].map((fy, i) => (
            <mesh key={`grill-${i}`} position={[0.106, fy, 0]}>
              <planeGeometry args={[0.005, 0.14]} />
              <meshStandardMaterial color="#0f0f15" roughness={0.5} metalness={0.3} />
            </mesh>
          ))}

          {/* Power button — bright glowing blue */}
          <mesh position={[0.108, 0.42, -0.14]}>
            <cylinderGeometry args={[0.012, 0.012, 0.008, 16]} />
            <meshBasicMaterial color={isPowerOff ? "#1e293b" : "#06b6d4"} />
          </mesh>

          {/* Top mesh vent panel */}
          <mesh position={[0, 0.522, 0]}>
            <boxGeometry args={[0.2, 0.005, 0.42]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.4} envMapIntensity={1.2} metalness={0.5} />
          </mesh>

          {/* Tempered glass side panel */}
          <mesh position={[-0.112, 0.26, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.003, 0.5, 0.44]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.18} roughness={0.04} envMapIntensity={1.2} metalness={0.1} />
          </mesh>
          {/* 3x RGB fans visible through glass */}
          {[0.06, -0.04, -0.14].map((fz, i) => (
            <group key={i} position={[-0.08, 0.28 + i * 0.01, fz]} rotation={[0, Math.PI / 2, 0]}>
              <mesh>
                <cylinderGeometry args={[0.075, 0.075, 0.012, 16]} />
                <meshBasicMaterial color={isPowerOff ? "#1e293b" : ["#6366f1", "#ec4899", "#06b6d4"][i]} />
              </mesh>
              {/* Fan blade ring */}
              <mesh position={[0, 0.008, 0]}>
                <torusGeometry args={[0.055, 0.006, 6, 16]} />
                <meshBasicMaterial color={isPowerOff ? "#1e293b" : "#ffffff"} />
              </mesh>
            </group>
          ))}
          {/* RGB DDR5 RAM sticks */}
          {[-0.016, 0.016].map((rz, i) => (
            <mesh key={i} position={[-0.02, 0.31, rz - 0.06]}>
              <boxGeometry args={[0.011, 0.068, 0.007]} />
              <meshBasicMaterial color={isPowerOff ? "#334155" : i === 0 ? "#06b6d4" : "#ec4899"} />
            </mesh>
          ))}
          {/* GPU card */}
          <group position={[-0.015, 0.12, 0.04]}>
            <RoundedBox args={[0.065, 0.042, 0.3]} radius={0.006} smoothness={3}>
              <meshStandardMaterial color="#18181b" metalness={0.82} roughness={0.25} envMapIntensity={1.2} />
            </RoundedBox>
            {/* GPU RGB logo bar */}
            <mesh position={[-0.036, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.24, 0.01]} />
              <meshBasicMaterial color={isPowerOff ? "#27272a" : "#22c55e"} />
            </mesh>
          </group>
          {/* Back I/O panel area */}
          <mesh position={[-0.108, 0.36, 0]}>
            <boxGeometry args={[0.006, 0.28, 0.38]} />
            <meshStandardMaterial color="#0f0f15" roughness={0.4} metalness={0.5} />
          </mesh>

          {/* USB ports on back (3 ports) */}
          {[-0.06, 0, 0.06].map((pz, i) => (
            <mesh key={`port-${i}`} position={[-0.105, 0.34, pz]}>
              <boxGeometry args={[0.004, 0.008, 0.008]} />
              <meshStandardMaterial color="#1a1a2e" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}

          {/* Power connector on back */}
          <mesh position={[-0.105, 0.12, 0.18]}>
            <boxGeometry args={[0.006, 0.015, 0.015]} />
            <meshStandardMaterial color="#c9a961" metalness={0.8} roughness={0.2} />
          </mesh>

        </group>
      </group>

      {/* ── DESIGNER BOOKSHELF (DOCS & ARCHITECTURE) ── */}
      <group
        name={interactName("interactable_docs")}
        userData={interactData("docs")}
        position={[5.8, 0, -1.8]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        {/* Back panel — warm oak */}
        <mesh position={[0, 1.3, -0.16]}>
          <boxGeometry args={[1.88, 2.62, 0.02]} />
          <meshStandardMaterial color="#c4956a" roughness={0.55} envMapIntensity={1.2} />
        </mesh>
        {/* Outer Frame — top */}
        <RoundedBox args={[1.9, 0.055, 0.38]} radius={0.02} smoothness={4} position={[0, 2.62, 0]}>
          <meshStandardMaterial color={hovered?.type === "docs" ? "#38bdf8" : "#b8814a"} roughness={0.4} envMapIntensity={1.2} />
        </RoundedBox>
        {/* Outer Frame — sides */}
        {[-0.93, 0.93].map((sx, i) => (
          <RoundedBox key={i} args={[0.055, 2.68, 0.38]} radius={0.02} smoothness={4} position={[sx, 1.34, 0]}>
            <meshStandardMaterial color={hovered?.type === "docs" ? "#38bdf8" : "#b8814a"} roughness={0.4} envMapIntensity={1.2} />
          </RoundedBox>
        ))}
        {/* Outer Frame — base kickboard */}
        <RoundedBox args={[1.9, 0.08, 0.38]} radius={0.02} smoothness={4} position={[0, 0.04, 0]}>
          <meshStandardMaterial color="#9a6b38" roughness={0.5} envMapIntensity={1.2} />
        </RoundedBox>
        {/* 3 Adjustable Shelves */}
        {[0.62, 1.3, 1.96].map((sy, i) => (
          <RoundedBox key={i} args={[1.78, 0.04, 0.34]} radius={0.01} smoothness={3} position={[0, sy, 0.01]}>
            <meshStandardMaterial color="#c4956a" roughness={0.45} envMapIntensity={1.2} />
          </RoundedBox>
        ))}
        {/* Shelf support pegs (brass) */}
        {[0.62, 1.3, 1.96].map((sy, si) =>
          [-0.75, 0.75].map((sx, pi) => (
            <mesh key={`${si}-${pi}`} position={[sx, sy - 0.03, -0.1]}>
              <cylinderGeometry args={[0.008, 0.008, 0.04, 8]} />
              <meshStandardMaterial color="#c5a028" metalness={0.88} roughness={0.2} envMapIntensity={1.2} />
            </mesh>
          ))
        )}
        {/* Marble bookend — bottom shelf left */}
        <group position={[-0.74, bookCenterY(0.62, 0.22), 0.04]}>
          <mesh>
            <boxGeometry args={[0.06, 0.22, 0.18]} />
            <meshStandardMaterial map={marbleTex} roughness={0.14} envMapIntensity={1.2} />
          </mesh>
        </group>
        {/* Bottom shelf — full row */}
        <ShelfBooks
          id="bottom"
          shelfY={0.62}
          books={generateBookRow(-0.58, 0.82, 18, 1)}
          spineTex={bookSpineTex}
          spineNormal={bookSpineNormal}
        />
        <HorizontalBookStack
          shelfY={0.62}
          x={0.52}
          spineTex={bookSpineTex}
          spineNormal={bookSpineNormal}
          layers={[
            { w: 0.24, d: 0.17, col: "#4a5568" },
            { w: 0.22, d: 0.16, col: "#722f37" },
            { w: 0.23, d: 0.17, col: "#1c2e4a" },
          ]}
        />

        {/* Middle shelf — full spine row */}
        <ShelfBooks
          id="middle"
          shelfY={1.3}
          books={generateBookRow(-0.78, 0.82, 20, 3)}
          spineTex={bookSpineTex}
          spineNormal={bookSpineNormal}
        />

        {/* Top shelf — full spine row */}
        <ShelfBooks
          id="top"
          shelfY={1.96}
          books={generateBookRow(-0.78, 0.82, 20, 7)}
          spineTex={bookSpineTex}
          spineNormal={bookSpineNormal}
        />
        {/* Small succulent on top */}
        <group position={[-0.45, 2.66, 0.04]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.07, 0.055, 0.08, 18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} envMapIntensity={1.2} />
          </mesh>
          {[0,1,2,3,4,5].map((idx) => {
            const a = (idx * Math.PI * 2) / 6;
            return (
              <mesh key={idx} position={[Math.cos(a)*0.032, 0.094, Math.sin(a)*0.032]} rotation={[0.32*Math.sin(a), a, 0.32*Math.cos(a)]}>
                <coneGeometry args={[0.022, 0.048, 5]} />
                <meshStandardMaterial color="#10b981" roughness={0.5} envMapIntensity={1.2} />
              </mesh>
            );
          })}
        </group>
      </group>


      {/* ── FRAMED WALL ART POSTERS ── */}
      {/* Poster 2: Solana Minimal Japanese Art (Above Desk on Back Wall) */}
      <group position={[1.4, 2.7, -5.92]}>
        <RoundedBox args={[1.4, 1.0, 0.04]} radius={0.02} smoothness={4} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1f2937" roughness={0.3} envMapIntensity={1.2} />
        </RoundedBox>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[1.3, 0.9]} />
          <meshBasicMaterial map={poster2Tex} />
        </mesh>
      </group>

      {/* ═══ INTERACTIVE: LAUNCH ROADMAP CORKBOARD ═══ */}
      <group
        name={interactName("interactable_board")}
        userData={interactData("board")}
        position={[5.88, 2.1, 1.2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        {/* Recessed backing panel */}
        <mesh position={[0, 0, -0.035]}>
          <boxGeometry args={[2.84, 1.84, 0.03]} />
          <meshStandardMaterial color="#3a2716" roughness={0.8} />
        </mesh>

        {/* Cork surface (recessed inside the frame) */}
        <mesh position={[0, 0, -0.012]} receiveShadow>
          <planeGeometry args={[2.72, 1.72]} />
          <meshStandardMaterial
            map={corkTex}
            color={hovered?.type === "board" ? "#e6c9f5" : "#ffffff"}
            roughness={0.95}
            metalness={0}
          />
        </mesh>

        {/* Mitred oak frame — four separate rails, proudly proud of the cork */}
        {[
          [0, 0.895, 2.9, 0.11],
          [0, -0.895, 2.9, 0.11],
        ].map(([fx, fy, fw, fh], i) => (
          <mesh key={`h${i}`} position={[fx, fy, 0.012]} castShadow>
            <boxGeometry args={[fw, fh, 0.075]} />
            <meshStandardMaterial
              map={oakFrameTex}
              color={hovered?.type === "board" ? "#c084fc" : "#ffffff"}
              roughness={0.45}
              metalness={0.02}
            />
          </mesh>
        ))}
        {[-1.395, 1.395].map((fx, i) => (
          <mesh key={`v${i}`} position={[fx, 0, 0.012]} castShadow>
            <boxGeometry args={[0.11, 1.68, 0.075]} />
            <meshStandardMaterial
              map={oakFrameTex}
              color={hovered?.type === "board" ? "#c084fc" : "#ffffff"}
              roughness={0.45}
              metalness={0.02}
            />
          </mesh>
        ))}
        {/* Thin inner lip that casts the recess shadow */}
        <mesh position={[0, 0, -0.004]}>
          <ringGeometry args={[0, 1, 4]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Pinned note cards — 6 cards, 3×2 grid (same copy as modal preview) */}
        {brandConfig.content.projectBoard.projects.slice(0, 6).map((p, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const tilt = [0.035, -0.022, 0.028, -0.018, 0.025, -0.03][idx];
          const pin = ["#e04343", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9"][idx];
          const cardW = 0.52;
          const cardH = 0.58;
          const colStep = 0.66;
          const rowStep = 0.64;
          const textW = 0.44;
          return (
            <group
              key={p.id}
              position={[-0.66 + col * colStep, 0.32 - row * rowStep, 0.006]}
              rotation={[0, 0, tilt]}
            >
              <mesh position={[0.012, -0.012, -0.004]}>
                <planeGeometry args={[cardW, cardH]} />
                <meshBasicMaterial color="#3a2410" transparent opacity={0.28} depthWrite={false} />
              </mesh>
              <mesh castShadow>
                <boxGeometry args={[cardW, cardH, 0.006]} />
                <meshStandardMaterial color="#f7f4ec" roughness={0.85} metalness={0} />
              </mesh>
              <mesh position={[0, cardH / 2 - 0.02, 0.004]}>
                <planeGeometry args={[cardW, 0.04]} />
                <meshBasicMaterial color={pin} />
              </mesh>
              <group position={[0, cardH / 2 - 0.08, 0.006]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.007, 0.007, 0.018, 12]} />
                  <meshStandardMaterial color={pin} roughness={0.35} metalness={0.1} />
                </mesh>
                <mesh position={[0, 0, 0.013]}>
                  <sphereGeometry args={[0.015, 16, 12]} />
                  <meshStandardMaterial color={pin} roughness={0.22} metalness={0.15} />
                </mesh>
                <mesh position={[0, 0, 0.021]}>
                  <sphereGeometry args={[0.005, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
                </mesh>
              </group>
              <group position={[-0.22, 0.13, 0.005]}>
                <Text
                  font={OFFICE_FONTS.body}
                  fontSize={0.018}
                  color="#78716c"
                  anchorX="left"
                  anchorY="top"
                >
                  {p.date}
                </Text>
                <Text
                  font={OFFICE_FONTS.display}
                  position={[0.42, 0, 0]}
                  fontSize={0.019}
                  color="#047857"
                  anchorX="right"
                  anchorY="top"
                >
                  {p.revenue}
                </Text>
                <Text
                  font={OFFICE_FONTS.display}
                  position={[0, -0.042, 0]}
                  fontSize={0.026}
                  color="#1c1917"
                  anchorX="left"
                  anchorY="top"
                  maxWidth={textW}
                  lineHeight={1.12}
                >
                  {p.name}
                </Text>
                <Text
                  font={OFFICE_FONTS.body}
                  position={[0, -0.092, 0]}
                  fontSize={0.017}
                  color={pin}
                  anchorX="left"
                  anchorY="top"
                  maxWidth={textW}
                >
                  {p.category}
                </Text>
                <Text
                  font={OFFICE_FONTS.body}
                  position={[0, -0.118, 0]}
                  fontSize={0.015}
                  color="#57534e"
                  anchorX="left"
                  anchorY="top"
                  maxWidth={textW}
                  lineHeight={1.22}
                >
                  {p.description}
                </Text>
                <Text
                  font={OFFICE_FONTS.body}
                  position={[0, -0.22, 0]}
                  fontSize={0.016}
                  color="#047857"
                  anchorX="left"
                  anchorY="top"
                >
                  {`● ${p.status}`}
                </Text>
              </group>
            </group>
          );
        })}
      </group>

      {/* ═══ INTERACTIVE: LOCKED DOOR — on the south wall (cut away in the miniature) ═══ */}
      {isLive && (
      <group
        name={interactName("interactable_door")}
        userData={interactData("door")}
        position={[-4.85, 0, 5.918]}
        rotation={[0, Math.PI, 0]}
        scale={[1.22, 1.22, 1.22]}
      >
        {/* Recessed jamb — flush with south wall inner face (z = 5.925) */}
        <mesh position={[0, 1.08, -0.055]}>
          <boxGeometry args={[1.18, 2.32, 0.12]} />
          <meshStandardMaterial color="#4a2c14" roughness={0.55} metalness={0.04} />
        </mesh>

        {/* Door frame trim */}
        {[
          [0, 2.28, -0.008, 1.24, 0.08, 0.07],
          [0, 0, -0.008, 1.24, 0.08, 0.07],
          [-0.58, 1.12, -0.008, 0.08, 2.32, 0.07],
          [0.58, 1.12, -0.008, 0.08, 2.32, 0.07],
        ].map(([fx, fy, fz, w, h, d], i) => (
          <mesh key={`door-frame-${i}`} position={[fx, fy, fz]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial
              map={walnutTex}
              color={hovered?.type === "door" ? "#a87848" : "#6b4423"}
              roughness={0.42}
              metalness={0.05}
            />
          </mesh>
        ))}

        {/* Door panel — inset slab */}
        <mesh position={[0, 1.1, 0.008]} castShadow>
          <boxGeometry args={[0.98, 2.12, 0.045]} />
          <meshStandardMaterial
            map={walnutTex}
            color={hovered?.type === "door" ? "#8f5e38" : "#5c3a22"}
            roughness={0.48}
            metalness={0.03}
            envMapIntensity={0.9}
          />
        </mesh>

        {/* Vertical panel grooves */}
        {[-0.26, 0, 0.26].map((gx, i) => (
          <mesh key={`door-groove-${i}`} position={[gx, 1.1, 0.036]}>
            <boxGeometry args={[0.014, 1.82, 0.009]} />
            <meshStandardMaterial color="#3d2515" roughness={0.7} />
          </mesh>
        ))}

        {/* Brass lever handle — toward room center (east) */}
        <group position={[0.38, 1.04, 0.065]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, 0.12, 12]} />
            <meshStandardMaterial color="#c2a24a" metalness={0.9} roughness={0.22} />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[0.1, 0.02, 0.032]} />
            <meshStandardMaterial color="#c2a24a" metalness={0.88} roughness={0.25} />
          </mesh>
        </group>

        {/* Lock escutcheon */}
        <mesh position={[0.38, 1.26, 0.048]}>
          <cylinderGeometry args={[0.025, 0.025, 0.014, 16]} />
          <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Subtle locked badge on door */}
        <Text
          font={OFFICE_FONTS.body}
          position={[0, 1.82, 0.042]}
          fontSize={0.062}
          color={hovered?.type === "door" ? "#fbbf24" : "#78716c"}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          LOCKED
        </Text>

        {/* Invisible hit volume for raycast */}
        <mesh position={[0, 1.12, 0.04]} visible={false}>
          <boxGeometry args={[1.15, 2.32, 0.14]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      )}

      {/* Treasury chest — floor beside the south door (east of the jamb) */}
      <group
        name={interactName("interactable_treasury")}
        userData={interactData("treasury")}
        position={[-1.55, 0, 5.18]}
        rotation={[0, Math.PI, 0]}
      >
        <Suspense fallback={null}>
          <TreasuryChestModel scale={0.72} />
        </Suspense>
        <mesh position={[0, 0.72, 0]} visible={false}>
          <boxGeometry args={[1.52, 1.52, 1.52]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {hovered?.type === "treasury" && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.62, 0.86, 40]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.72} depthWrite={false} />
          </mesh>
        )}
      </group>

      {/* Framed photo — south wall, same plane as the door */}
      {isLive && (
        <group
          name={interactName("interactable_painting")}
          userData={interactData("painting")}
          position={[1.72, 1.82, 5.918]}
          rotation={[0, Math.PI, 0]}
        >
          <FramedAlonPainting
            map={alonTex}
            woodMap={walnutTex}
            hovered={hovered?.type === "painting"}
          />
          <mesh position={[0, 0, 0.04]} visible={false}>
            <boxGeometry args={[1.08, 1.68, 0.16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* ═══ INTERACTIVE: ABOUT STUDIO PLAQUE (BACK WALL — eye level, per layout arrow) ═══ */}
      <group
        name={interactName("interactable_about")}
        userData={interactData("about")}
        position={[3.45, 1.72, -5.76]}
      >
        <RoundedBox args={[1.05, 0.54, 0.035]} radius={0.015} smoothness={4}>
          <meshStandardMaterial
            color={hovered?.type === "about" ? "#c084fc" : "#1f2937"}
            roughness={0.35}
            envMapIntensity={1.2}
          />
        </RoundedBox>
        <Text
          font={OFFICE_FONTS.serif}
          position={[0, 0.05, 0.022]}
          fontSize={0.095}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
        >
          ABOUT OPPOS
        </Text>
        <Text
          font={OFFICE_FONTS.body}
          position={[0, -0.1, 0.022]}
          fontSize={0.052}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
        >
          Studio · FAQ · Team
        </Text>
      </group>

      {/* ═══ INTERACTIVE OBJECT 4: WALL POWER PLUG EASTER EGG ═══ */}
      <group
        name={interactName("interactable_plug")}
        userData={interactData("plug")}
        position={[3.2, 0.38, -5.92]}
      >
        <RoundedBox args={[0.18, 0.22, 0.025]} radius={0.01} smoothness={2} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={hovered?.type === "plug" ? "#ef4444" : "#ffffff"}
            roughness={0.2} envMapIntensity={1.2}
          />
        </RoundedBox>

        <RoundedBox args={[0.08, 0.09, 0.07]} radius={0.01} smoothness={2} position={[0, 0, isPowerOff ? 0.16 : 0.045]}>
          <meshStandardMaterial
            color={isPowerOff ? "#ef4444" : "#1f2937"}
            roughness={0.4} envMapIntensity={1.2}
          />
        </RoundedBox>

        <mesh position={[0, -0.18, isPowerOff ? 0.16 : 0.045]}>
          <cylinderGeometry args={[0.01, 0.01, 0.35]} />
          <meshStandardMaterial color="#111827" roughness={0.7} envMapIntensity={1.2} />
        </mesh>

        <mesh position={[0, 0.06, 0.015]}>
          <circleGeometry args={[0.012, 16]} />
          <meshBasicMaterial color={isPowerOff ? "#ef4444" : "#22c55e"} />
        </mesh>
      </group>

      {/* ── 1. COZY CREATIVE LOUNGE & CHILL CORNER ── */}
      <group
        name={interactName("interactable_sofa")}
        userData={interactData("sofa")}
        position={[5.08, 0, 4.35]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <SheenArmchair scale={1.45} />
        <mesh position={[0, 0.52, 0]} visible={false}>
          <boxGeometry args={[1.05, 1.1, 1.05]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* Round Italian Carrara Marble Coffee Table with Accessories */}
      <group position={[3.85, 0, 4.35]}>
        {/* Table Top with Polished Carrara Marble Texture */}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 0.035, 48]} />
          <meshStandardMaterial
            map={marbleTex}
            roughness={0.15} envMapIntensity={1.2}
            metalness={0.06}
          />
        </mesh>
        {/* Brass Inset Bevel Edge Ring */}
        <mesh position={[0, 0.404, 0]}>
          <cylinderGeometry args={[0.463, 0.463, 0.008, 48]} />
          <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} envMapIntensity={1.2} />
        </mesh>
        {/* 3 Hairpin Black Metal Legs */}
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((rad, i) => (
          <mesh key={i} position={[Math.cos(rad) * 0.34, 0.2, Math.sin(rad) * 0.34]}>
            <cylinderGeometry args={[0.01, 0.01, 0.4, 32]} />
            <meshStandardMaterial color="#18181b" metalness={0.85} />
          </mesh>
        ))}
        {/* High-Fidelity Glazed Ceramic Coffee Mug Model */}
        <CoffeeMug position={[0.16, 0.438, 0.08]} scale={0.012} rotation={[0, 0.6, 0]} />
        {/* Apple iPad / Digital Drawing Tablet */}
        <group position={[-0.1, 0.44, -0.06]} rotation={[0, 0.2, 0]}>
          <RoundedBox args={[0.26, 0.008, 0.18]} radius={0.008} smoothness={2}>
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} envMapIntensity={1.2} />
          </RoundedBox>
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.24, 0.16]} />
            <meshBasicMaterial map={tabletUiTex} />
          </mesh>
          {/* Apple Pencil */}
          <mesh position={[0.15, 0.005, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.004, 0.004, 0.16, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} envMapIntensity={1.2} />
          </mesh>
        </group>
        {/* High-End Printed Architecture Magazine (Open Spread) */}
        <group position={[-0.1, 0.44, 0.14]} rotation={[0, -0.22, 0]}>
          <RoundedBox args={[0.34, 0.008, 0.23]} radius={0.003} smoothness={2}>
            <meshStandardMaterial color="#f1f5f9" roughness={0.7} envMapIntensity={1.2} />
          </RoundedBox>
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.33, 0.22]} />
            <meshStandardMaterial map={magazineTex} roughness={0.35} envMapIntensity={1.2} />
          </mesh>
        </group>

        {/* Luxury Scented Soy Candle in Amber Glass Jar with Flickering Flame */}
        <group position={[0.2, 0.44, -0.16]}>
          {/* Amber Glass Jar */}
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.042, 0.042, 0.09, 20]} />
            <meshStandardMaterial color="#b45309" transparent opacity={0.82} roughness={0.1} envMapIntensity={1.2} />
          </mesh>
          {/* Soy Wax */}
          <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.039, 16]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.9} envMapIntensity={1.2} />
          </mesh>
          {/* Candle Wick */}
          <mesh position={[0, 0.082, 0]}>
            <cylinderGeometry args={[0.002, 0.002, 0.022]} />
            <meshStandardMaterial color="#1c1917" />
          </mesh>
          {/* Glowing Flame Mesh */}
          <mesh position={[0, 0.096, 0]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        </group>
      </group>

      {/* Modern Arched Brass Floor Reading Lamp — right side of lounge chair */}
      <group position={[5.42, 0, 5.28]} rotation={[0, 0, 0]}>
        {/* Heavy Black Marble Base */}
        <mesh position={[0, 0.025, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
          <meshStandardMaterial color="#1c1917" roughness={0.2} envMapIntensity={1.2} metalness={0.3} />
        </mesh>
        {/* Arching Brass Pole */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 2.35]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} envMapIntensity={1.2} />
        </mesh>
        {/* Horizontal Extension Tube */}
        <mesh position={[-0.35, 2.36, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.7]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} envMapIntensity={1.2} />
        </mesh>
        {/* Brass Bell Shade & Warm Glowing Bulb */}
        <group position={[-0.7, 2.25, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.16, 0.16, 20]} />
            <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} envMapIntensity={1.2} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#fde68a" />
          </mesh>
        </group>
      </group>

      {/* ── 2. ACOUSTIC GUITAR ON FLOOR STAND — beside lounge sofa ── */}
      <GuitarOnStand
        name={interactName("interactable_guitar")}
        userData={interactData("guitar")}
        position={[5.05, 0, 2.15]}
        rotation={[0, -Math.PI / 2 + 0.15, 0]}
      />

      {/* ── 3. VINYL TURNTABLE CONSOLE & RECORD CRATE ── */}
      <group position={[5.4, 0, -0.1]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Mid-century walnut credenza: top, carcass, two doors, splayed legs */}
        {/* Top with slight overhang */}
        <RoundedBox args={[1.26, 0.045, 0.46]} radius={0.012} smoothness={4} position={[0, 0.705, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={walnutTex} roughness={0.34} metalness={0.03} />
        </RoundedBox>
        {/* Carcass */}
        <RoundedBox args={[1.18, 0.44, 0.42]} radius={0.012} smoothness={3} position={[0, 0.46, 0]} castShadow>
          <meshStandardMaterial map={walnutTex} color="#e8e2da" roughness={0.4} metalness={0.02} />
        </RoundedBox>
        {/* Two cabinet doors, inset with a reveal gap */}
        {[-0.29, 0.29].map((dx, i) => (
          <group key={i} position={[dx, 0.46, 0.212]}>
            <RoundedBox args={[0.55, 0.4, 0.018]} radius={0.006} smoothness={3}>
              <meshStandardMaterial map={walnutTex} roughness={0.3} metalness={0.04} />
            </RoundedBox>
            {/* recessed brass finger pull */}
            <mesh position={[i === 0 ? 0.21 : -0.21, 0.1, 0.012]}>
              <boxGeometry args={[0.11, 0.022, 0.012]} />
              <meshStandardMaterial color="#c2a24a" metalness={0.88} roughness={0.24} />
            </mesh>
          </group>
        ))}
        {/* Kick rail under the carcass */}
        <mesh position={[0, 0.225, 0]}>
          <boxGeometry args={[1.1, 0.03, 0.38]} />
          <meshStandardMaterial color="#2e1a0c" roughness={0.6} />
        </mesh>
        {/* 4 splayed tapered brass-tipped legs */}
        {[
          [-0.5, -0.17, 0.13, 0.1],
          [0.5, -0.17, -0.13, 0.1],
          [-0.5, 0.17, 0.13, -0.1],
          [0.5, 0.17, -0.13, -0.1],
        ].map(([lx, lz, rz, rx], i) => (
          <group key={i} position={[lx, 0.12, lz]} rotation={[rx, 0, rz]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.021, 0.011, 0.24, 12]} />
              <meshStandardMaterial color="#4a2c14" roughness={0.35} metalness={0.05} />
            </mesh>
            {/* brass ferrule */}
            <mesh position={[0, -0.118, 0]}>
              <cylinderGeometry args={[0.012, 0.011, 0.022, 12]} />
              <meshStandardMaterial color="#c2a24a" metalness={0.9} roughness={0.22} />
            </mesh>
          </group>
        ))}

        {/* Turntable Base */}
        <RoundedBox args={[0.45, 0.06, 0.36]} radius={0.01} smoothness={2} position={[-0.28, 0.76, 0]}>
          <meshStandardMaterial color="#18181b" metalness={0.7} roughness={0.3} envMapIntensity={1.2} />
        </RoundedBox>
        {/* Black Vinyl Record Platter (Spinning smoothly) */}
        <group ref={isLive ? vinylRef : undefined} position={[-0.28, 0.8, 0]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.13, 0.008, 32]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.2} envMapIntensity={1.2} />
          </mesh>
          <mesh position={[0, 0.005, 0]}>
            <circleGeometry args={[0.042, 20]} rotation={[-Math.PI / 2, 0, 0]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
        {/* Brass Tonearm resting on record groove */}
        <mesh position={[-0.13, 0.81, 0.07]} rotation={[0, -0.42, 0]}>
          <boxGeometry args={[0.16, 0.008, 0.008]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>

        {/* Vintage Vacuum Tube Audio Pre-Amplifier with Glowing Filaments */}
        <group position={[0.02, 0.74, -0.06]}>
          {/* Brushed Aluminum & Black Chassis */}
          <RoundedBox args={[0.2, 0.07, 0.15]} radius={0.008} smoothness={2} position={[0, 0.035, 0]}>
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} envMapIntensity={1.2} />
          </RoundedBox>
          {/* Brass Volume Knob */}
          <mesh position={[0, 0.035, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.012, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} envMapIntensity={1.2} />
          </mesh>
          {/* Dual Miniature Glowing Vacuum Tubes */}
          {[-0.045, 0.045].map((tx, idx) => (
            <group key={idx} position={[tx, 0.07, 0]}>
              {/* Glass Tube Envelope */}
              <mesh position={[0, 0.032, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.065, 16]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.32} roughness={0.1} envMapIntensity={1.2} />
              </mesh>
              {/* Glowing Orange Incandescent Filament Inside */}
              <mesh position={[0, 0.032, 0]}>
                <cylinderGeometry args={[0.004, 0.004, 0.035, 8]} />
                <meshBasicMaterial color={isPowerOff ? "#334155" : "#ff6a00"} />
              </mesh>
            </group>
          ))}
        </group>
        {/* High-End Vinyl LP Record Display Stand with 'OPPOS Sessions' Cover */}
        <group position={[0.34, 0.74, 0]}>
          {/* Slotted Walnut Wood LP Stand */}
          <RoundedBox args={[0.32, 0.04, 0.16]} radius={0.008} smoothness={2} position={[0, 0.02, 0]}>
            <meshStandardMaterial color="#451a03" roughness={0.4} envMapIntensity={1.2} />
          </RoundedBox>
          {/* Front Vinyl LP Jacket - 'OPPOS SESSIONS' */}
          <group position={[0, 0.16, 0.02]} rotation={[-0.15, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.31, 0.31, 0.006]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} envMapIntensity={1.2} />
            </mesh>
            {/* Front Artwork Print */}
            <mesh position={[0, 0, 0.004]}>
              <planeGeometry args={[0.305, 0.305]} />
              <meshStandardMaterial map={vinylCoverTex} roughness={0.35} envMapIntensity={1.2} />
            </mesh>
          </group>
          {/* Secondary Vinyl Sleeves Behind */}
          {[-0.03, -0.06].map((offsetZ, idx) => (
            <group key={idx} position={[0, 0.16, offsetZ]} rotation={[-0.15, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.31, 0.31, 0.005]} />
                <meshStandardMaterial color={idx === 0 ? "#1e293b" : "#334155"} roughness={0.5} envMapIntensity={1.2} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ── 4. LUSH INDOOR PLANTS (NATURAL COZINESS) ── */}
      {/* Tall Monstera Deliciosa by the Window — Professional GLB Model */}
      <PlantModel position={[-0.9, 0, -5.3]} castShadow receiveShadow />

      {/* Plant beside Bookshelf — same GLB model */}
      <PlantModel position={[5.4, 0, -3.4]} scale={0.8} rotation={[0, 1.2, 0]} />

      {/* ── 5. FLOATING WALL SHELVES ABOVE DESK ── */}
      <group position={[1.4, 0, -5.92]}>
        {/* Shelf 1 */}
        <group position={[0, 2.2, 0]}>
          <RoundedBox args={[1.8, 0.035, 0.22]} radius={0.01} smoothness={2}>
            <meshStandardMaterial color="#8a5a36" roughness={0.4} envMapIntensity={1.2} />
          </RoundedBox>
          {/* Books row on shelf */}
          <group position={[-0.55, 0.12, 0]}>
            {BOOK_SPINE_COLORS.slice(0, 5).map((bCol, i) => (
              <RoundedBox key={i} args={[0.038, 0.2, 0.16]} radius={0.005} smoothness={2} position={[i * 0.048, 0, 0]}>
                <meshStandardMaterial {...bookSpineMaterialProps(bCol, i + 50, bookSpineTex, bookSpineNormal)} />
              </RoundedBox>
            ))}
          </group>
          {/* Architectural Solid Brass Ring Sculpture on Marble Pedestal */}
          <group position={[0.42, 0.08, 0]}>
            {/* Dark Marble Plinth */}
            <mesh position={[0, 0.015, 0]}>
              <boxGeometry args={[0.07, 0.03, 0.07]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} envMapIntensity={1.2} metalness={0.4} />
            </mesh>
            {/* Interlocking Brushed Brass Ring */}
            <mesh position={[0, 0.08, 0]} rotation={[0, 0.4, 0]}>
              <torusGeometry args={[0.05, 0.01, 16, 32]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.18} envMapIntensity={1.2} />
            </mesh>
          </group>
        </group>

        {/* Shelf 2 (Higher Shelf) */}
        <group position={[0, 2.62, 0]}>
          <RoundedBox args={[1.4, 0.035, 0.22]} radius={0.01} smoothness={2}>
            <meshStandardMaterial color="#8a5a36" roughness={0.4} envMapIntensity={1.2} />
          </RoundedBox>

          {/* Nordic Ceramic Donut Vase with Dried Botanical Sprigs */}
          <group position={[-0.42, 0.035, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <torusGeometry args={[0.065, 0.024, 16, 32]} />
              <meshStandardMaterial color="#fefbf3" roughness={0.85} envMapIntensity={1.2} />
            </mesh>
            {/* Dried Botanical Stems */}
            {[[-0.01, 0.22, 0], [0.01, 0.25, 0.01]].map((p, i) => (
              <mesh key={i} position={p} rotation={[0, 0, (i - 0.5) * 0.25]}>
                <cylinderGeometry args={[0.002, 0.003, 0.16]} />
                <meshStandardMaterial color="#d97706" roughness={0.9} envMapIntensity={1.2} />
              </mesh>
            ))}
          </group>

          {/* Lush Cascading English Ivy in Ribbed Matte Pot */}
          <group position={[0.32, 0.035, 0]}>
            {/* Ribbed Ceramic Planter */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.055, 0.045, 0.1, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.4} envMapIntensity={1.2} />
            </mesh>
            {/* Soil */}
            <mesh position={[0, 0.098, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.05, 12]} />
              <meshStandardMaterial color="#1c1917" roughness={0.9} envMapIntensity={1.2} />
            </mesh>
            {/* Cascading Ivy Vine Branches with Small Leaves */}
            {[-0.04, 0, 0.04].map((vx, vi) => (
              <group key={vi} position={[vx, 0.08, 0.04]}>
                <mesh position={[0, -0.08 * (vi + 1.2), 0.02 * vi]}>
                  <cylinderGeometry args={[0.003, 0.004, 0.16 * (vi + 1.2)]} />
                  <meshStandardMaterial color="#166534" />
                </mesh>
                {/* Organic Leaf Flakes */}
                {[-0.05, -0.1, -0.16].map((ly, li) => (
                  <mesh key={li} position={[li % 2 === 0 ? 0.02 : -0.02, ly, 0.02]} rotation={[0.4, 0, (li % 2 === 0 ? 0.5 : -0.5)]}>
                    <coneGeometry args={[0.018, 0.035, 5]} />
                    <meshStandardMaterial color="#15803d" roughness={0.4} envMapIntensity={1.2} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        </group>
      </group>

      {/* ── 6. PROJECT LOGO WALL SIGN ── */}
      <group position={[-5.92, 2.9, 1.2]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[2.35, 0.82, 0.02]} radius={0.03} smoothness={3}>
          <meshStandardMaterial color="#09090b" roughness={0.3} envMapIntensity={1.2} metalness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[2.18, 0.7]} />
          <meshBasicMaterial
            map={projectLogoTex}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ── 7. FULL-LENGTH LEANING ARCH MIRROR ── */}
      <ArchMirror position={[5.62, 0.02, 3.2]} rotation={[0, -Math.PI / 2, -0.06]} />
    </group>
  );
}
