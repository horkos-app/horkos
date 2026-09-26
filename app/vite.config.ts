import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, process.cwd(), "").RPC_URL || "https://api.devnet.solana.com";
  const proxy = { "/rpc": { target, changeOrigin: true, ws: true, ignorePath: true } };
  return {
    plugins: [react()],
    define: { "process.env": {} },
    server: { fs: { allow: [".."] }, proxy },
    preview: { proxy },
  };
});
