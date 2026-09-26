import "./polyfill";
import "./nocturne.css";
import "@phosphor-icons/web/regular";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { COMMITMENT, RPC_URL } from "./chain";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConnectionProvider endpoint={RPC_URL} config={{ commitment: COMMITMENT }}>
      <WalletProvider wallets={[]} autoConnect>
        <App />
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
);
