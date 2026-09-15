import { solscanAccount } from "./solana.js";
import { brandConfig } from "../config/brandConfig.js";

const BASE_LINKS = [
  {
    label: "Official Website",
    href: "https://oppos.app",
    external: true,
    desc: "Main dApp interface",
  },
  {
    label: "X / Twitter",
    href: brandConfig.meta.socials.twitter,
    external: true,
    desc: "Announcements & updates",
  },
  {
    label: "Contract Address",
    href: null,
    value: brandConfig.meta.contractAddress,
    desc: "$OPPOS mint on pump.fun",
  },
  {
    label: "Solana RPC Health",
    href: "https://status.solana.com",
    external: true,
    desc: "Mainnet operational status",
  },
];

export function buildDocLinks(treasuryWallet) {
  const links = [...BASE_LINKS];
  if (treasuryWallet && !String(treasuryWallet).includes("PLACEHOLDER")) {
    links.splice(2, 0, {
      label: "Treasury Solscan",
      href: solscanAccount(treasuryWallet),
      external: true,
      desc: "Public fee wallet on Solscan",
    });
  }
  return links;
}
