import { PrivyProvider as PrivyAuthProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const appId = import.meta.env.VITE_PRIVY_APP_ID;

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

if (!appId) {
  console.warn("[Oppos] Missing VITE_PRIVY_APP_ID — wallet connect disabled");
}

export function PrivyProvider({ children }) {
  if (!appId) {
    return children;
  }

  return (
    <PrivyAuthProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
          showWalletLoginFirst: true,
          walletChainType: "solana-only",
          walletList: [
            "phantom",
            "solflare",
            "backpack",
            "detected_solana_wallets",
            "wallet_connect_qr_solana",
          ],
        },
        loginMethods: ["wallet"],
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
        embeddedWallets: {
          solana: { createOnLogin: "off" },
        },
      }}
    >
      {children}
    </PrivyAuthProvider>
  );
}
