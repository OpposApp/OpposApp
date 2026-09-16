// Brand & Visual Identity Configuration for 3D Office Exploration
// Edit this file to easily rebrand or customize assets, audio, and content.

export const brandConfig = {
  meta: {
    brandName: "OPPOS",
    tagline: "Creative Protocol Studio · Solana",
    subtitle: "First-Person 3D Virtual Workspace",
    socials: {
      twitter: "https://x.com/OpposApp",
      github: "https://github.com/OpposApp/OpposApp",
      email: "hello@oppos.app",
    },
    contractAddress: "Ay25n6nkFGib2qXLsbqAPhiU81ubuEvDWyVksECRpump",
  },

  theme: {
    primaryColor: "#6366f1",
    accentColor: "#f59e0b",  // Warm amber
    highlightColor: "#22c55e",
    reticleColor: "rgba(255, 255, 255, 0.85)",
    reticleHoverColor: "#38bdf8",
    backgroundColor: "#e8edf5", // Soft daylight sky
    fogColor: "#eef2f7",
    ambientLightColor: "#fff8eb", // Warm sunlight ambient
  },

  model: {
    // Set to true once you have placed your custom Blender GLB export into public/models/office.glb
    // When false, a stunning high-fidelity procedural 3D studio is rendered immediately!
    useCustomGlb: false,
    glbPath: "/models/office.glb",
    spawnPosition: [0, 1.6, 3.2], // [X, Eye-Height Y, Z]
    moveSpeed: 4.5,
    sprintSpeed: 7.5,
    bounds: {
      minX: -5.65,
      maxX: 5.65,
      minZ: -5.65,
      maxZ: 5.65,
    },
  },

  audio: {
    defaultVolume: 0.45,
    stations: [
      {
        id: "lofi",
        name: "Lofi Sol Beats",
        genre: "Chillhop / Ambient",
        url: "https://stream.zeno.fm/f3wvbbqmdg8uv",
      },
      {
        id: "synthwave",
        name: "Nightride FM",
        genre: "Synthwave / Cyberpunk",
        url: "https://stream.nightride.fm/nightride.mp3",
      },
      {
        id: "ambient",
        name: "Deep Space Focus",
        genre: "Electronic / Deep Ambient",
        url: "https://stream.nightride.fm/chillsynth.mp3",
      },
    ],
  },

  mint: {
    burnAmountTokens: 22_222,
    burnAmountRaw: 22_222_000_000n, // 22,222 @ 6 decimals
    mintSol: 0.2,
    mintSurchargeLamports: 200_000_000n,
    tokenDecimals: 6,
    artPath: "/NFT.png",
  },

  rewards: {
    /** Holder SOL payout cadence (OTC-style clock, faster cycle) */
    distributionIntervalHours: 6,
    holderSplitPercent: 50,
    payoutScheduleUtc: "00:00 · 06:00 · 12:00 · 18:00 UTC",
    payoutShort: "every 6 hours",
    payoutLabel: "6-Hour SOL Cycles",
    payoutDescription:
      "Hold an Oppos Pass — 50% of creator fees are designed to be swept and airdropped in SOL on a 6-hour clock. The payout job is not live yet.",
  },

  content: {
    workstation: {
      title: "OPPOS Dev Station · Node #01",
      systemStatus: "ONLINE · SOLANA",
      uptime: "99.98%",
      codeSnippet: `// OPPOS Automated Revenue Sharing Engine
import { Connection, PublicKey } from "@solana/web3.js";

export async function distributeFeePool(poolAddress) {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const poolBalance = await connection.getBalance(new PublicKey(poolAddress));
  
  // 50% split → Pass Holders on a designed 6-hour clock (00/06/12/18 UTC)
  const holderShare = poolBalance * 0.5;
  console.log(\`[OPPOS] 6h cycle (not live): would disburse \${holderShare / 1e9} SOL to verified Pass holders.\`);
  return { status: "SCHEDULED", amountSol: holderShare / 1e9 };
}`,
      quickLinks: [
        { label: "Solana RPC Health", url: "https://status.solana.com", external: true },
        { label: "Mint Pass Terminal", action: "mint" },
        { label: "Holder Analytics", action: "rewards" },
      ],
    },

    projectBoard: {
      title: "OPPOS Launch Roadmap",
      subtitle: "Protocol Milestones · Fair Launch Timeline · On-Chain Deliverables",
      projects: [
        {
          id: "milestone-1",
          name: "$OPPOS Token Launch",
          category: "Token · pump.fun",
          status: "Completed",
          revenue: "Live",
          date: "Phase 0",
          description: "Fair launch on pump.fun with creator-fee routing wired to the holder revenue pool.",
        },
        {
          id: "milestone-2",
          name: "3D Holder Office",
          category: "Product · WebGL",
          status: "Completed",
          revenue: "Shipped",
          date: "Phase 1",
          description: "First-person 3D workspace with mint terminal, docs, rewards view, and live protocol HUD.",
        },
        {
          id: "milestone-3",
          name: "Oppos Pass Collection",
          category: "NFT · Metaplex Core",
          status: "In Progress",
          revenue: "2,222 Max",
          date: "Phase 1",
          description: "Revenue-sharing Pass NFT — 1 Pass = 1 equal share of 50% creator fees paid in SOL.",
        },
        {
          id: "milestone-4",
          name: "Burn & Mint Terminal",
          category: "Mint · Atomic TX",
          status: "In Progress",
          revenue: "22,222 + 0.2 SOL",
          date: "Phase 2",
          description: "Burn 22,222 $OPPOS + pay 0.2 SOL in one flow to mint 1 Pass to your wallet.",
        },
        {
          id: "milestone-5",
          name: "6-Hour SOL Payouts",
          category: "Revenue · Distribution",
          status: "Upcoming",
          revenue: "Every 6h",
          date: "Phase 2",
          description: "Designed holder snapshots at 00/06/12/18 UTC — 50% of fees airdropped once the payout job ships. Not live yet.",
        },
        {
          id: "milestone-6",
          name: "On-Chain Indexer",
          category: "Infra · Helius + Supabase",
          status: "In Progress",
          revenue: "Next",
          date: "Phase 3",
          description: "Mint indexer writes Passes to Supabase when the watch process is running. Holder snapshots + payout history follow when the payout job ships.",
        },
      ],
    },

    easterEgg: {
      label: "Main Power Circuit Breaker",
      plugPrompt: "Pull / Plug Power Cable",
      blackoutWarning: "EMERGENCY POWER OUTAGE · BREAKER TRIPPED",
    },
  },
};
