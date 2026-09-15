import { isPrivyConfigured } from "../lib/env.js";
import { ConnectButtonPrivy } from "./ConnectButtonPrivy.jsx";

export function ConnectButton() {
  if (!isPrivyConfigured) {
    return (
      <span
        className="font-mono text-[10px] text-amber-400/80 tracking-wider"
        title="Add VITE_PRIVY_APP_ID to .env.local"
      >
        Wallet unavailable
      </span>
    );
  }

  return <ConnectButtonPrivy />;
}
