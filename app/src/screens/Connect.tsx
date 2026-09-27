import { useEffect, useState } from "react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import { DAY, fetchChain, makeProgram } from "../chain";
import { initials, period, short, sol, span } from "../format";
import { Icon, Linkify } from "../ui";

type Popular = { issuer: string; name: string; desc: string; price: number; duration: number; resign: number; holders: number; pda: string };

const SAMPLE: Popular[] = [
  { issuer: "Arcwise Labs", name: "Arcwise IDE Pro", desc: "Full IDE license with cloud sync and priority support.", price: 2.4e9, duration: 365 * DAY, resign: 14 * DAY, holders: 128, pda: "Lc7d0000Pq2e" },
  { issuer: "Northbeam Software", name: "Northbeam Sync", desc: "", price: 0.5e9, duration: 30 * DAY, resign: 0, holders: 64, pda: "Nb3k0000Xw9a" },
];

async function loadPopular(connection: Connection): Promise<Popular[]> {
  const chain = await fetchChain(makeProgram(connection));
  const now = Date.now() / 1000;
  const issuers = new Map(chain.issuers.map((i) => [i.pda.toBase58(), i]));
  return chain.types
    .flatMap((t) => {
      const iss = issuers.get(t.issuer.toBase58());
      if (!t.active || !iss?.active) return [];
      const holders = chain.licenses.filter((l) => l.type.equals(t.pda) && l.expiresAt > now).length;
      return [{ ...t, issuer: iss.name || short(iss.authority), holders, pda: t.pda.toBase58() }];
    })
    .sort((a, b) => b.holders - a.holders)
    .slice(0, 2);
}

export function Connect() {
  const { connection } = useConnection();
  const [popular, setPopular] = useState(SAMPLE);
  useEffect(() => {
    loadPopular(connection)
      .then((p) => p.length && setPopular(p))
      .catch(() => {});
  }, [connection]);
  const [front, back] = popular;
  const { wallets, select, wallet, connecting } = useWallet();
  const usable = wallets.filter((w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable);
  return (
    <main style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr)", gap: "calc(var(--space-8)*3)", alignItems: "center", padding: "calc(var(--space-8)*3) calc(var(--space-8)*3) calc(var(--space-8)*4)", maxWidth: 1320 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div className="card-kicker">Software licensing on Solana</div>
        <h1 style={{ fontSize: 52, margin: 0, textWrap: "balance" }}>Licenses that live on-chain and verify for free.</h1>
        <p className="text-muted" style={{ fontSize: 17, maxWidth: 520, textWrap: "pretty", margin: 0 }}>
          Buy, renew and refund software licenses with your wallet. Every license is a Solana account your apps can read directly — no license server, no lookup fees.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", maxWidth: 400, marginTop: "var(--space-4)" }}>
          <h6 className="text-muted" style={{ margin: "0 0 var(--space-1)" }}>Connect a wallet</h6>
          {usable.map((w) => {
            const busy = connecting && wallet?.adapter.name === w.adapter.name;
            return (
              <button
                key={w.adapter.name}
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", gap: "var(--space-4)", padding: "var(--space-3) var(--space-4)" }}
                onClick={() => !connecting && select(w.adapter.name)}
              >
                <span style={{ width: 28, height: 28, borderRadius: "var(--radius-md)", background: "var(--color-neutral-800)", display: "grid", placeItems: "center", fontSize: 12, color: "var(--color-neutral-200)", overflow: "hidden" }}>
                  {w.adapter.icon ? <img src={w.adapter.icon} alt="" width={20} height={20} /> : initials(w.adapter.name)}
                </span>
                <span style={{ flex: 1, textAlign: "left" }}>{w.adapter.name}</span>
                {busy ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-accent-300)" }}>
                    <Icon n="circle-notch" spin />
                    Approve in wallet…
                  </span>
                ) : (
                  <span className="text-muted" style={{ fontSize: 12 }}>Detected</span>
                )}
              </button>
            );
          })}
          {!usable.length && (
            <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
              No Solana wallet detected. Install a Wallet Standard wallet such as{" "}
              <a href="https://phantom.com" target="_blank" rel="noreferrer">Phantom</a>,{" "}
              <a href="https://solflare.com" target="_blank" rel="noreferrer">Solflare</a> or{" "}
              <a href="https://backpack.app" target="_blank" rel="noreferrer">Backpack</a>, then reload.
            </p>
          )}
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {back && (
          <div className="card elev-md" style={{ padding: "var(--space-6)", gap: "var(--space-4)", transform: "rotate(-2deg) translateX(24px)", opacity: 0.55, width: "92%", minHeight: 172 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="card-kicker">{back.issuer}</span>
              <span className="tag tag-neutral">{back.holders} active</span>
            </div>
            <div className="card-title">{back.name}</div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--color-neutral-800)" }} />
          </div>
        )}
        <div className="card elev-lg" style={{ padding: "var(--space-8)", gap: "var(--space-4)", minHeight: 330 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-kicker">{front.issuer}</span>
            <span className="tag tag-accent">{front.holders} active licenses</span>
          </div>
          <div className="card-title" style={{ fontSize: 24 }}>{front.name}</div>
          {front.desc && <p className="card-body" style={{ margin: 0 }}><Linkify text={front.desc} /></p>}
          <div style={{ display: "flex", gap: "var(--space-8)", fontSize: 13 }}>
            <div><div className="text-muted" style={{ fontSize: 11 }}>Price</div><div>{sol(front.price)} SOL / {period(front.duration)}</div></div>
            <div><div className="text-muted" style={{ fontSize: 11 }}>Refund window</div><div>{front.resign ? span(front.resign) : "None"}</div></div>
            <div><div className="text-muted" style={{ fontSize: 11 }}>Account</div><div className="mono">{short(front.pda)}</div></div>
          </div>
        </div>
        <div className="text-muted" style={{ display: "flex", gap: "var(--space-8)", fontSize: 12, padding: "0 var(--space-2)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}><Icon n="arrow-counter-clockwise" />Refund window on every license</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}><Icon n="magnifying-glass" />Free on-chain verification</span>
        </div>
      </div>
    </main>
  );
}
