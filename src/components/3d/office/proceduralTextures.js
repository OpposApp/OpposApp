import * as THREE from "three";

// Cache textures to avoid recreating on each render
const textureCache = new Map();

/**
 * Perlin-like noise for texture generation
 */
function generateNoise(x, y, scale = 10) {
  return Math.sin(x / scale) * Math.cos(y / scale) * Math.sin((x + y) / scale);
}

/**
 * Generate wood floor normal map for realistic surface detail
 */
export function getWoodFloorNormalMap() {
  if (textureCache.has("wood_floor_normal")) return textureCache.get("wood_floor_normal");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Base normal map gray (neutral normal pointing up)
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 1024, 1024);

  // Add wood grain detail with Perlin-like noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const i = (y * 1024 + x) * 4;

      // Multi-octave Perlin noise for wood grain
      let noise = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxNoise = 0;

      for (let octave = 0; octave < 4; octave++) {
        noise += generateNoise(x * frequency, y * frequency) * amplitude;
        maxNoise += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }

      noise = (noise / maxNoise) * 127;
      const brightness = Math.floor(128 + noise);

      data[i] = brightness;     // R
      data[i + 1] = brightness; // G
      data[i + 2] = brightness; // B
      data[i + 3] = 255;        // A
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  textureCache.set("wood_floor_normal", texture);
  return texture;
}

/**
 * Procedural Warm Oak Hardwood Plank Texture - Enhanced High-Resolution Version
 */
export function getWoodFloorTexture() {
  if (textureCache.has("wood_floor")) return textureCache.get("wood_floor");

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");

  // Base warm honey-oak color with subtle variation
  const gradient = ctx.createLinearGradient(0, 0, 0, 2048);
  gradient.addColorStop(0, "#b89968");
  gradient.addColorStop(0.3, "#b5814c");
  gradient.addColorStop(0.7, "#a97536");
  gradient.addColorStop(1, "#b5814c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2048, 2048);

  // Draw planks with much higher detail
  const plankHeight = 128;
  const plankLengths = [512, 768, 640, 896, 1024, 576];
  const numRows = 2048 / plankHeight;

  for (let r = 0; r < numRows; r++) {
    const y = r * plankHeight;
    let x = -((r * 256) % 512);

    while (x < 2048) {
      const len = plankLengths[(r + Math.floor(x / 400)) % plankLengths.length];

      // Rich color variation with multiple tones
      const tone = ((r * 17 + Math.floor(x / 100)) % 11) - 5;
      const saturation = 50 + Math.sin(r * 0.5) * 8;
      const lightness = 50 + tone * 3 + Math.sin(x * 0.001) * 4;
      ctx.fillStyle = `hsl(32, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x + 2, y + 2, len - 4, plankHeight - 4);

      // Detailed wood grain lines with varying opacity
      for (let g = 0; g < 8; g++) {
        const gy = y + 8 + g * 13 + ((x * 3) % 11);
        const opacity = 0.05 + Math.sin(g * 0.8) * 0.04;
        ctx.fillStyle = `rgba(70, 40, 15, ${opacity})`;
        ctx.fillRect(x, gy, len, Math.random() * 2 + 1);
      }

      // Fine detail pore texture
      ctx.fillStyle = "rgba(100, 70, 40, 0.08)";
      for (let p = 0; p < 80; p++) {
        const px = x + Math.random() * len;
        const py = y + Math.random() * plankHeight;
        const psize = Math.random() * 2 + 0.5;
        ctx.fillRect(px, py, psize, psize * 0.5);
      }

      // Plank dark seam border with gradient
      const seamGradient = ctx.createLinearGradient(x, y, x + len, y);
      seamGradient.addColorStop(0, "rgba(45, 25, 10, 0.5)");
      seamGradient.addColorStop(0.5, "rgba(45, 25, 10, 0.3)");
      seamGradient.addColorStop(1, "rgba(45, 25, 10, 0.5)");
      ctx.strokeStyle = seamGradient;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, len, plankHeight);

      x += len;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  textureCache.set("wood_floor", texture);
  return texture;
}

/**
 * Generate rug normal map
 */
export function getRugNormalMap() {
  if (textureCache.has("rug_normal")) return textureCache.get("rug_normal");

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 512);

  // Woven texture pattern for normals
  ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
  for (let x = 0; x < 512; x += 16) {
    ctx.fillRect(x, 0, 8, 512);
  }
  for (let y = 0; y < 512; y += 16) {
    ctx.fillRect(0, y, 512, 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set("rug_normal", texture);
  return texture;
}

/**
 * Procedural Luxury Moroccan Berber Woven Wool Rug - Enhanced
 */
export function getRugTexture() {
  if (textureCache.has("rug_texture")) return textureCache.get("rug_texture");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Cream-beige wool base
  ctx.fillStyle = "#f5f1e8";
  ctx.fillRect(0, 0, 1024, 1024);

  // Woven texture pattern
  ctx.fillStyle = "rgba(200, 180, 160, 0.15)";
  for (let x = 0; x < 1024; x += 8) {
    ctx.fillRect(x, 0, 4, 1024);
  }
  for (let y = 0; y < 1024; y += 8) {
    ctx.fillRect(0, y, 1024, 4);
  }

  // Charcoal diamond trellis pattern
  ctx.strokeStyle = "rgba(70, 50, 40, 0.35)";
  ctx.lineWidth = 3;
  const diamondSize = 80;
  for (let dx = 0; dx < 1024; dx += diamondSize * 2) {
    for (let dy = 0; dy < 1024; dy += diamondSize * 2) {
      // Draw diamond
      ctx.beginPath();
      ctx.moveTo(dx + diamondSize, dy);
      ctx.lineTo(dx + diamondSize * 2, dy + diamondSize);
      ctx.lineTo(dx + diamondSize, dy + diamondSize * 2);
      ctx.lineTo(dx, dy + diamondSize);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Braided fringes at edges
  ctx.fillStyle = "rgba(100, 80, 60, 0.4)";
  for (let x = 0; x < 1024; x += 12) {
    ctx.fillRect(x, 0, 6, 40);
    ctx.fillRect(x, 984, 6, 40);
  }

  // Rich texture variation through noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    data[i] += noise;
    data[i + 1] += noise * 0.8;
    data[i + 2] += noise * 0.6;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  textureCache.set("rug_texture", texture);
  return texture;
}

/**
 * Desk area rug — deep indigo flat-weave with terracotta accent bands
 */
export function getDeskRugTexture() {
  if (textureCache.has("desk_rug_texture")) return textureCache.get("desk_rug_texture");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#2a3555";
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle cross-weave
  ctx.globalAlpha = 0.14;
  for (let x = 0; x < 1024; x += 6) {
    ctx.fillStyle = x % 12 === 0 ? "#1e2844" : "#35456a";
    ctx.fillRect(x, 0, 3, 1024);
  }
  for (let y = 0; y < 1024; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? "#1e2844" : "#35456a";
    ctx.fillRect(0, y, 1024, 3);
  }
  ctx.globalAlpha = 1;

  // Terracotta border bands
  ctx.fillStyle = "#b85c38";
  const border = 52;
  ctx.fillRect(border, border, 1024 - border * 2, 14);
  ctx.fillRect(border, 1024 - border - 14, 1024 - border * 2, 14);
  ctx.fillRect(border, border, 14, 1024 - border * 2);
  ctx.fillRect(1024 - border - 14, border, 14, 1024 - border * 2);

  // Inner sand accent frame
  ctx.strokeStyle = "#c9a882";
  ctx.lineWidth = 5;
  ctx.strokeRect(88, 88, 848, 848);

  // Minimal horizontal stripe pattern
  ctx.fillStyle = "rgba(201, 168, 130, 0.22)";
  for (let y = 180; y < 844; y += 72) {
    ctx.fillRect(120, y, 784, 8);
  }

  // Soft fiber noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] += noise * 0.6;
    data[i + 1] += noise * 0.5;
    data[i + 2] += noise;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set("desk_rug_texture", texture);
  return texture;
}

/**
 * Generate marble normal map
 */
export function getMarbleNormalMap() {
  if (textureCache.has("marble_normal")) return textureCache.get("marble_normal");

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle veining for normal map
  const veins = [
    { start: [50, 100], c1: [150, 150], c2: [300, 250], end: [450, 400], width: 2, col: "rgba(150, 150, 150, 0.4)" },
    { start: [100, 400], c1: [200, 350], c2: [350, 300], end: [450, 200], width: 1.5, col: "rgba(140, 140, 140, 0.3)" },
  ];

  veins.forEach((v) => {
    ctx.strokeStyle = v.col;
    ctx.lineWidth = v.width;
    ctx.beginPath();
    ctx.moveTo(v.start[0], v.start[1]);
    ctx.bezierCurveTo(v.c1[0], v.c1[1], v.c2[0], v.c2[1], v.end[0], v.end[1]);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set("marble_normal", texture);
  return texture;
}

/**
 * Procedural Luxury Marble Texture - Enhanced
 */
export function getMarbleTexture() {
  if (textureCache.has("marble_texture")) return textureCache.get("marble_texture");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // White base with subtle gray gradient
  const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
  gradient.addColorStop(0, "#f8f8f7");
  gradient.addColorStop(0.5, "#fffbf5");
  gradient.addColorStop(1, "#f5f5f3");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  // Organic veining with multiple layers
  const veins = [
    { start: [100, 150], c1: [250, 200], c2: [400, 300], end: [800, 700], width: 4, col: "rgba(100, 100, 110, 0.4)" },
    { start: [50, 400], c1: [200, 450], c2: [500, 550], end: [900, 650], width: 3, col: "rgba(120, 120, 135, 0.3)" },
    { start: [150, 50], c1: [400, 150], c2: [600, 450], end: [950, 800], width: 5, col: "rgba(90, 95, 110, 0.35)" },
    { start: [80, 900], c1: [300, 750], c2: [550, 600], end: [850, 250], width: 3.5, col: "rgba(105, 110, 125, 0.32)" },
  ];

  veins.forEach((v) => {
    ctx.strokeStyle = v.col;
    ctx.lineWidth = v.width;
    ctx.beginPath();
    ctx.moveTo(v.start[0], v.start[1]);
    ctx.bezierCurveTo(v.c1[0], v.c1[1], v.c2[0], v.c2[1], v.end[0], v.end[1]);
    ctx.stroke();
  });

  // Add subtle speckling
  ctx.fillStyle = "rgba(180, 180, 190, 0.08)";
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const size = Math.random() * 1.5 + 0.3;
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set("marble_texture", texture);
  return texture;
}

/**
 * Procedural Modern Code IDE Screen Texture
 */
export function getMainScreenTexture() {
  if (textureCache.has("main_screen")) return textureCache.get("main_screen");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Dark IDE window background
  ctx.fillStyle = "#0c1017";
  ctx.fillRect(0, 0, 1024, 512);

  // Window title bar
  ctx.fillStyle = "#161b22";
  ctx.fillRect(0, 0, 1024, 38);

  // Window mac dots (red, yellow, green)
  const dots = ["#ff5f56", "#ffbd2e", "#27c93f"];
  dots.forEach((c, idx) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(22 + idx * 20, 19, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Tab
  ctx.fillStyle = "#0c1017";
  ctx.fillRect(100, 6, 180, 32);
  ctx.fillStyle = "#58a6ff";
  ctx.font = "bold 13px monospace";
  ctx.fillText("distribute.ts", 120, 26);

  // Sidebar
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 38, 160, 474);
  ctx.fillStyle = "#8b949e";
  ctx.font = "11px monospace";
  const files = ["▾ src", "  ▸ components", "  ▸ contracts", "    distribute.ts", "    solana.ts", "    metrics.json"];
  files.forEach((f, i) => {
    ctx.fillText(f, 16, 70 + i * 22);
  });

  // Code editor lines
  const codeLines = [
    { num: "1", text: "import { Connection, PublicKey } from '@solana/web3.js';", col: "#ff7b72" },
    { num: "2", text: "import { OPPOS_REVENUE_VAULT } from './constants';", col: "#d2a8ff" },
    { num: "3", text: "", col: "#c9d1d9" },
    { num: "4", text: "export async function syncHolderFeePool() {", col: "#79c0ff" },
    { num: "5", text: "  const cluster = 'https://api.mainnet-beta.solana.com';", col: "#a5d6ff" },
    { num: "6", text: "  const balance = await getSolanaBalance(OPPOS_REVENUE_VAULT);", col: "#c9d1d9" },
    { num: "7", text: "  // Split 50% automatically to pass holders", col: "#8b949e" },
    { num: "8", text: "  const holderDistribution = balance.lamports * 0.50;", col: "#ffa657" },
    { num: "9", text: "  console.log(`Disbursing ${holderDistribution / 1e9} SOL...`);", col: "#7ee787" },
    { num: "10", text: "  return executeAirdropBatch(holderDistribution);", col: "#79c0ff" },
    { num: "11", text: "}", col: "#79c0ff" },
  ];

  ctx.fillStyle = "#1e222b";
  ctx.fillRect(160, 38, 45, 474);

  codeLines.forEach((l, idx) => {
    const y = 72 + idx * 24;
    ctx.fillStyle = "#484f58";
    ctx.font = "12px monospace";
    ctx.fillText(l.num, 175, y);

    ctx.fillStyle = l.col;
    ctx.font = "13px monospace";
    ctx.fillText(l.text, 220, y);
  });

  // Mini live stats chart
  ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
  ctx.fillRect(720, 60, 280, 200);
  ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(720, 60, 280, 200);

  ctx.fillStyle = "#818cf8";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("SOLANA HOLDER REVENUE", 735, 85);

  ctx.beginPath();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  const points = [180, 170, 190, 160, 140, 150, 120, 110, 130, 95];
  points.forEach((py, i) => {
    const px = 740 + i * 26;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = "#161b22";
  ctx.fillRect(0, 484, 1024, 28);
  ctx.fillStyle = "#3fb950";
  ctx.font = "bold 11px monospace";
  ctx.fillText("● SOLANA MAINNET CONNECTED  |  TPS: 2,840  |  UTF-8  |  TypeScript", 16, 502);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("main_screen", texture);
  return texture;
}

/**
 * Procedural Portrait Monitor (Vertical Terminal Texture)
 */
export function getVerticalScreenTexture() {
  if (textureCache.has("vertical_screen")) return textureCache.get("vertical_screen");

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, 512, 1024);

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, 512, 48);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 15px monospace";
  ctx.fillText("OPPOS Terminal", 20, 32);

  // Terminal content
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px monospace";
  const lines = [
    "$ npm run build",
    "Building OPPOS for production...",
    "[████████████████████] 100%",
    "✓ Build complete in 3.2s",
    "",
    "$ solana-deploy",
    "Deploying to mainnet...",
    "Transaction: 2k3j4h2k...",
    "✓ Deployment successful",
    "Program ID: oppos111...",
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, 16, 80 + i * 24);
  });

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("vertical_screen", texture);
  return texture;
}

/**
 * Procedural Art Poster Texture
 */
export function getArtPosterTexture(variant = 0) {
  const key = `art_poster_${variant}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  const palettes = [
    ["#2d1b69", "#4a1d83", "#8b1e3c"],
    ["#0f172a", "#1e3a5f", "#0369a1"],
  ];
  const [c0, c1, c2] = palettes[variant % palettes.length];
  const labels = ["ART", "SOL"];

  const gradient = ctx.createLinearGradient(0, 0, 512, 768);
  gradient.addColorStop(0, c0);
  gradient.addColorStop(0.5, c1);
  gradient.addColorStop(1, c2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 768);

  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  for (let i = 0; i < 20; i++) {
    const x = ((variant + 1) * 47 + i * 83) % 512;
    const y = ((variant + 1) * 61 + i * 97) % 768;
    const size = 50 + (i * 17) % 150;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 215, 100, 0.3)";
  for (let i = 0; i < 5; i++) {
    const x = ((variant + 2) * 31 + i * 71) % 412;
    const y = ((variant + 3) * 53 + i * 89) % 568;
    ctx.fillRect(x, y, 100 + i * 20, 100 + i * 15);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText(labels[variant % labels.length], 40, 100);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Procedural Radio Grille Texture (Speaker)
 */
export function getRadioGrilleTexture() {
  if (textureCache.has("radio_grille")) return textureCache.get("radio_grille");

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(0, 0, 256, 256);

  // Hexagonal/circular speaker holes
  ctx.fillStyle = "#1a1a1a";
  for (let x = 20; x < 256; x += 30) {
    for (let y = 20; y < 256; y += 30) {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Metal texture sheen
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = Math.random() * 8 + 1;
    const h = 0.5;
    ctx.fillRect(x, y, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set("radio_grille", texture);
  return texture;
}

/**
 * Procedural Outdoor Window View — warm late-afternoon city park
 */
export function getOutdoorViewTexture() {
  if (textureCache.has("outdoor_view_v3")) return textureCache.get("outdoor_view_v3");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Clear afternoon sky
  const sky = ctx.createLinearGradient(0, 0, 0, 265);
  sky.addColorStop(0, "#5b8fc4");
  sky.addColorStop(0.4, "#9ec5e8");
  sky.addColorStop(0.72, "#f3e4c8");
  sky.addColorStop(1, "#e8c898");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 265);

  // Sun disc + bloom (right side, matches room light)
  ctx.fillStyle = "rgba(255, 248, 210, 0.95)";
  ctx.beginPath();
  ctx.arc(860, 78, 28, 0, Math.PI * 2);
  ctx.fill();
  const sunBloom = ctx.createRadialGradient(860, 78, 20, 860, 78, 190);
  sunBloom.addColorStop(0, "rgba(255, 240, 190, 0.55)");
  sunBloom.addColorStop(0.5, "rgba(255, 220, 150, 0.18)");
  sunBloom.addColorStop(1, "rgba(255, 210, 130, 0)");
  ctx.fillStyle = sunBloom;
  ctx.fillRect(0, 0, 1024, 265);

  // Light clouds
  for (let i = 0; i < 7; i++) {
    const x = 70 + i * 135 + Math.sin(i * 1.4) * 25;
    const y = 36 + Math.cos(i * 1.9) * 18;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + (i % 2) * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 52, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 38, y - 6, 42, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant hills
  ctx.fillStyle = "#7a9488";
  ctx.beginPath();
  ctx.moveTo(0, 255);
  for (let x = 0; x <= 1024; x += 64) {
    ctx.lineTo(x, 230 - Math.sin(x / 120) * 18 - Math.cos(x / 55) * 10);
  }
  ctx.lineTo(1024, 265);
  ctx.lineTo(0, 265);
  ctx.closePath();
  ctx.fill();

  // Mid-ground tree line
  ctx.fillStyle = "#3d5c48";
  for (let i = 0; i < 16; i++) {
    const x = i * 64 + 20;
    const base = 268;
    const h = 75 + Math.sin(i * 2.1) * 28;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.bezierCurveTo(x - 28, base - h * 0.4, x - 14, base - h, x, base - h);
    ctx.bezierCurveTo(x + 14, base - h, x + 28, base - h * 0.4, x, base);
    ctx.fill();
  }

  // Lawn foreground
  const lawn = ctx.createLinearGradient(0, 275, 0, 512);
  lawn.addColorStop(0, "#6ea068");
  lawn.addColorStop(0.5, "#4f7d52");
  lawn.addColorStop(1, "#3a5a3e");
  ctx.fillStyle = lawn;
  ctx.fillRect(0, 275, 1024, 237);

  // Soft bokeh bushes
  for (let i = 0; i < 10; i++) {
    const x = 50 + i * 95 + Math.sin(i * 2.8) * 22;
    const y = 360 + Math.cos(i * 2.2) * 35;
    ctx.fillStyle = `rgba(45, 75, 50, ${0.25 + (i % 3) * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, 24 + (i % 4) * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle side foliage framing (not too dark)
  ctx.fillStyle = "rgba(30, 50, 32, 0.45)";
  ctx.beginPath();
  ctx.moveTo(0, 310);
  ctx.quadraticCurveTo(60, 270, 110, 330);
  ctx.lineTo(0, 400);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1024, 295);
  ctx.quadraticCurveTo(960, 255, 900, 315);
  ctx.lineTo(1024, 390);
  ctx.closePath();
  ctx.fill();

  // Light edge vignette only
  const vig = ctx.createRadialGradient(512, 256, 220, 512, 256, 580);
  vig.addColorStop(0.82, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(15,10,6,0.28)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 1024, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set("outdoor_view_v3", texture);
  return texture;
}

/**
 * Single-pass glass sheen — cool tint + soft glare (no transmission shader)
 */
export function getWindowGlassSheenTexture() {
  if (textureCache.has("window_glass_sheen_v2")) return textureCache.get("window_glass_sheen_v2");

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Base cool glass tint (very subtle)
  ctx.fillStyle = "rgba(228, 240, 252, 0.07)";
  ctx.fillRect(0, 0, 512, 512);

  // Soft sun patch upper-right
  const sun = ctx.createRadialGradient(400, 88, 2, 400, 88, 160);
  sun.addColorStop(0, "rgba(255, 250, 230, 0.28)");
  sun.addColorStop(0.45, "rgba(255, 240, 210, 0.1)");
  sun.addColorStop(1, "rgba(255, 230, 200, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 512, 512);

  // Delicate horizontal reflection
  const streak = ctx.createLinearGradient(0, 0, 512, 0);
  streak.addColorStop(0, "rgba(255,255,255,0)");
  streak.addColorStop(0.42, "rgba(255,255,255,0.09)");
  streak.addColorStop(0.58, "rgba(255,255,255,0.07)");
  streak.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = streak;
  ctx.fillRect(0, 175, 512, 45);

  // Edge fresnel
  const rim = ctx.createRadialGradient(256, 256, 170, 256, 256, 370);
  rim.addColorStop(0.75, "rgba(255,255,255,0)");
  rim.addColorStop(0.95, "rgba(255,255,255,0.06)");
  rim.addColorStop(1, "rgba(255,255,255,0.14)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set("window_glass_sheen_v2", texture);
  return texture;
}

/**
 * Stylized outdoor view behind the office window (pale sky + tree masses)
 */
export function getWindowViewTexture() {
  if (textureCache.has("window_view_sky_v2")) return textureCache.get("window_view_sky_v2");

  const w = 1536;
  const h = 1536;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#7eafd0");
  sky.addColorStop(0.4, "#b7d3e8");
  sky.addColorStop(0.62, "#dceaf3");
  sky.addColorStop(0.85, "#e8f1f6");
  sky.addColorStop(1, "#d5e3c4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sun = ctx.createRadialGradient(1240, 640, 20, 1240, 640, 400);
  sun.addColorStop(0, "rgba(255, 248, 224, 0.7)");
  sun.addColorStop(0.35, "rgba(255, 236, 200, 0.18)");
  sun.addColorStop(1, "rgba(255, 236, 200, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  const cloud = (x, y, rx, ry, a) => {
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  cloud(300, 780, 220, 48, 0.35);
  cloud(500, 760, 140, 38, 0.22);
  cloud(980, 820, 240, 50, 0.24);
  cloud(1180, 800, 120, 34, 0.18);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  textureCache.set("window_view_sky_v2", texture);
  return texture;
}

/**
 * Woven linen curtain fabric with baked pleat shading
 */
export function getCurtainFabricTexture() {
  if (textureCache.has("curtain_fabric")) return textureCache.get("curtain_fabric");

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ddd2c2";
  ctx.fillRect(0, 0, 512, 1024);

  // Vertical pleat valleys (warm shadow)
  const pleatW = 32;
  for (let x = 0; x < 512; x += pleatW) {
    const valley = ctx.createLinearGradient(x, 0, x + pleatW, 0);
    valley.addColorStop(0, "rgba(120, 98, 72, 0.22)");
    valley.addColorStop(0.45, "rgba(235, 225, 208, 0.08)");
    valley.addColorStop(0.55, "rgba(255, 252, 245, 0.18)");
    valley.addColorStop(1, "rgba(110, 90, 68, 0.2)");
    ctx.fillStyle = valley;
    ctx.fillRect(x, 0, pleatW, 1024);
  }

  // Linen weave cross-hatch
  ctx.globalAlpha = 0.18;
  for (let y = 0; y < 1024; y += 3) {
    ctx.strokeStyle = y % 6 === 0 ? "#b8a890" : "#c9bba8";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 0; x < 512; x += 3) {
    ctx.strokeStyle = x % 6 === 0 ? "#b8a890" : "#c9bba8";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  // Subtle fiber noise
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 6000; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? "#f5efe4" : "#a89478";
    ctx.fillRect(px, py, 1, 1);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.anisotropy = 8;
  textureCache.set("curtain_fabric", texture);
  return texture;
}

/**
 * Subtle normal map for linen curtain weave
 */
export function getCurtainFabricNormalMap() {
  if (textureCache.has("curtain_fabric_normal")) return textureCache.get("curtain_fabric_normal");

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#8080ff";
  ctx.fillRect(0, 0, 256, 512);

  const imgData = ctx.getImageData(0, 0, 256, 512);
  const data = imgData.data;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      const weave = Math.sin(x / 4) * Math.cos(y / 5) * 18;
      const pleat = Math.sin(x / 14) * 12;
      const bump = weave + pleat;
      data[i] = 128 + bump;
      data[i + 1] = 128 + bump * 0.4;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  textureCache.set("curtain_fabric_normal", texture);
  return texture;
}

/**
 * Book spine cloth texture — neutral base tinted per-book via material.color
 */
export function getBookSpineTexture() {
  if (textureCache.has("book_spine")) return textureCache.get("book_spine");

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#9a9a9a";
  ctx.fillRect(0, 0, 128, 512);

  // Vertical linen ribbing
  for (let x = 0; x < 128; x += 1) {
    const v = x % 3 === 0 ? 18 : x % 3 === 1 ? -10 : 4;
    ctx.fillStyle = `rgb(${154 + v}, ${154 + v}, ${154 + v})`;
    ctx.fillRect(x, 0, 1, 512);
  }

  // Title block — lighter cloth patch
  ctx.fillStyle = "rgba(255, 252, 240, 0.28)";
  ctx.fillRect(10, 155, 108, 88);
  ctx.fillStyle = "rgba(255, 252, 240, 0.14)";
  ctx.fillRect(14, 300, 100, 42);

  // Embossed title lines
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(18, 188, 92, 5);
  ctx.fillRect(22, 200, 84, 3);
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(18, 194, 92, 2);

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(20, 318, 88, 4);

  // Spine edge crease shadows
  const leftShade = ctx.createLinearGradient(0, 0, 22, 0);
  leftShade.addColorStop(0, "rgba(20, 12, 8, 0.45)");
  leftShade.addColorStop(1, "rgba(20, 12, 8, 0)");
  ctx.fillStyle = leftShade;
  ctx.fillRect(0, 0, 22, 512);

  const rightShade = ctx.createLinearGradient(106, 0, 128, 0);
  rightShade.addColorStop(0, "rgba(20, 12, 8, 0)");
  rightShade.addColorStop(1, "rgba(20, 12, 8, 0.42)");
  ctx.fillStyle = rightShade;
  ctx.fillRect(106, 0, 22, 512);

  // Scuffs & shelf wear
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 120; i++) {
    const px = Math.random() * 128;
    const py = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
    ctx.fillRect(px, py, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  textureCache.set("book_spine", texture);
  return texture;
}

/** Normal map for book cloth ribbing */
export function getBookSpineNormalMap() {
  if (textureCache.has("book_spine_normal")) return textureCache.get("book_spine_normal");

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#8080ff";
  ctx.fillRect(0, 0, 128, 512);

  const imgData = ctx.getImageData(0, 0, 128, 512);
  const data = imgData.data;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const rib = Math.sin(x / 2.2) * 14;
      const wear = Math.sin(y / 40) * 4;
      data[i] = 128 + rib;
      data[i + 1] = 128 + wear;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set("book_spine_normal", texture);
  return texture;
}

/**
 * Clear texture cache - useful for memory management
 */
export function clearTextureCache() {
  textureCache.forEach(texture => texture.dispose());
  textureCache.clear();
}
