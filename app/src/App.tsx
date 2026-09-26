import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { CLUSTER, configPda, errorMessage, explorerAddr, fetchChain, makeProgram, PROGRAM_ID, sendIxs, TxError, type ChainState, type IssuerAcc, type TypeAcc } from "./chain";
import type { Ctx, Role, Screen, TxSpec } from "./ctx";
import { short, sol } from "./format";
import { Buyer, Connect, Issuer, Master } from "./screens";
import { DevDocs, ForIssuers, HowItWorks, PAGES, type Page } from "./screens/Info";
import { Icon, Seg, TxModal, type TxView } from "./ui";

const NAV: Record<Role, { k: Screen; label: string; icon: string }[]> = {
  master: [
    { k: "issuers", label: "Issuers", icon: "users-three" },
    { k: "fees", label: "Operation fees", icon: "coins" },
  ],
  issuer: [
    { k: "types", label: "License types", icon: "stack" },
    { k: "editor", label: "New license type", icon: "plus-square" },
    { k: "payouts", label: "Payouts", icon: "hand-coins" },
  ],
  buyer: [
    { k: "browse", label: "Browse", icon: "storefront" },
    { k: "mine", label: "My licenses", icon: "key" },
  ],
};
const HOME: Record<Role, Screen> = { master: "issuers", issuer: "types", buyer: "browse" };
const ROLE_OPTS: { v: Role; l: string; icon: string }[] = [
  { v: "master", l: "Master", icon: "crown-simple" },
  { v: "issuer", l: "Issuer", icon: "stack" },
  { v: "buyer", l: "User / Owner", icon: "user" },
];

const nowSec = () => Math.floor(Date.now() / 1000);
const readPage = (): Page | null => PAGES.find((p) => "#" + p.k === window.location.hash)?.k ?? null;

function usePage() {
  const [page, setPage] = useState(readPage);
  useEffect(() => {
    const on = () => {
      setPage(readPage());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return page;
}

export default function App() {
  const { connection } = useConnection();
  const { publicKey, connected, signTransaction, disconnect } = useWallet();
  const anchorWallet = useAnchorWallet();
  const program = useMemo(() => makeProgram(connection, anchorWallet), [connection, anchorWallet]);
  const page = usePage();

  const [chain, setChain] = useState<ChainState | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(nowSec);
  const [role, setRole] = useState<Role>("buyer");
  const [screen, setScreen] = useState<Screen>("browse");
  const [editing, setEditing] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ReactNode>(null);
  const [tx, setTx] = useState<TxView | null>(null);
  const lastTx = useRef<TxSpec | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [c, b] = await Promise.all([fetchChain(program), publicKey ? connection.getBalance(publicKey) : Promise.resolve(null)]);
      setChain(c);
      setBalance(b);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(errorMessage(e));
    }
    setNow(nowSec());
  }, [program, connection, publicKey]);

  useEffect(() => {
    if (!connected) return;
    refresh();
    const t = setInterval(refresh, 120_000);
    const c = setInterval(() => setNow(nowSec()), 15_000);
    return () => {
      clearInterval(t);
      clearInterval(c);
    };
  }, [connected, refresh]);

  const me = publicKey;
  const isMaster = !!(chain?.cfg && me && chain.cfg.master.equals(me));
  const myIssuer = me ? chain?.issuers.find((i) => i.authority.equals(me)) : undefined;
  const roles = ROLE_OPTS.filter((r) => r.v === "buyer" || (r.v === "master" && isMaster) || (r.v === "issuer" && !!myIssuer));

  useEffect(() => {
    if (!chain) return;
    if (!roles.some((r) => r.v === role)) {
      setRole("buyer");
      setScreen("browse");
    }
  }, [chain, roles, role]);

  const copy = (v: string) =>
    navigator.clipboard.writeText(v).then(() => {
      setCopied(v);
      setTimeout(() => setCopied(null), 1500);
    });

  const pickRole = (r: Role) => {
    setRole(r);
    setScreen(HOME[r]);
    setEditing(null);
    setDialog(null);
  };

  const runTx = useCallback(
    (spec: TxSpec) => {
      if (!me || !signTransaction) return;
      lastTx.current = spec;
      setDialog(null);
      const base = { kicker: spec.kicker, title: spec.title, detail: spec.detail };
      setTx({ ...base, phase: "prepare" });
      (async () => {
        try {
          const ixs = await spec.ixs();
          const sig = await sendIxs(connection, me, async (t) => {
            setTx({ ...base, phase: "sign" });
            return signTransaction(t);
          }, ixs, () => setTx({ ...base, phase: "send" }));
          setTx({ ...base, phase: "done", sig });
          spec.after?.();
        } catch (e) {
          if (e instanceof TxError && e.rejected) setTx({ ...base, phase: "rejected" });
          else setTx({ ...base, phase: "failed", error: errorMessage(e) });
        }
        refresh();
      })();
    },
    [me, signTransaction, connection, refresh],
  );

  if (!connected || !me) {
    return (
      <Shell
        right={
          <>
            <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
              {PAGES.map((p) => (
                <a key={p.k} href={"#" + p.k} style={page === p.k ? { color: "var(--color-text)", textDecoration: "underline", textDecorationColor: "var(--color-accent)", textUnderlineOffset: 6 } : { textDecoration: "none" }}>
                  {p.label}
                </a>
              ))}
            </nav>
            <button className="btn btn-secondary">
              <Icon n="seal-check" />
              Verify a license
            </button>
          </>
        }
      >
        {page === "how" ? <HowItWorks /> : page === "issuers" ? <ForIssuers /> : page === "docs" ? <DevDocs /> : <Connect />}
      </Shell>
    );
  }

  const typeIdx = new Map(chain?.types.map((t) => [t.pda.toBase58(), t]));
  const issuerIdx = new Map(chain?.issuers.map((i) => [i.pda.toBase58(), i]));
  const issuerName = (i: IssuerAcc | undefined) => (i ? i.name || short(i.authority) : "Unknown issuer");
  const ctx: Ctx | null = chain && {
    chain,
    now,
    me,
    balance,
    program,
    myIssuer,
    type: (pda: PublicKey) => typeIdx.get(pda.toBase58()),
    issuerOf: (t: TypeAcc) => issuerIdx.get(t.issuer.toBase58()),
    typeName: (t) => (t ? t.name : "Unknown license"),
    issuerName,
    licensesOf: (t) => chain.licenses.filter((l) => l.type.equals(t.pda)),
    openDlg: setDialog,
    closeDlg: () => setDialog(null),
    runTx,
    go: (s, e = null) => {
      setScreen(s);
      setEditing(e);
    },
    editing,
  };

  const needsSetup = chain && !chain.cfg;
  const nav = NAV[role].map((n) => ({
    ...n,
    on: screen === n.k && !(n.k === "editor" && editing),
    count:
      !chain ? "" :
      n.k === "mine" ? chain.licenses.filter((l) => l.owner.equals(me)).length :
      n.k === "issuers" ? chain.issuers.filter((i) => i.active).length :
      n.k === "types" && myIssuer ? chain.types.filter((t) => t.issuer.equals(myIssuer.pda)).length : "",
  }));

  return (
    <Shell
      right={
        <>
          {ctx && chain?.cfg && !myIssuer && (
            <button className="btn btn-secondary" onClick={() => setDialog(<Issuer.PurchaseDialog ctx={ctx} />)}>
              <Icon n="storefront" />
              Become issuer
            </button>
          )}
          {roles.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span className="text-muted" style={{ fontSize: 12 }}>Viewing as</span>
              <Seg name="role" value={role} opts={roles} onPick={pickRole} />
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />
            <button
              className="mono"
              title="Copy address"
              onClick={() => copy(me.toBase58())}
              style={{ fontSize: 13, color: "var(--color-text)", background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--space-1)" }}
            >
              {copied === me.toBase58() ? "Copied" : short(me)}
              <Icon n={copied === me.toBase58() ? "check" : "copy"} />
            </button>
            <a href={explorerAddr(me)} target="_blank" rel="noreferrer" title="View in explorer" style={{ fontSize: 13, color: "var(--color-text-muted, inherit)", display: "flex" }}>
              <Icon n="arrow-up-right" />
            </a>
            <span className="text-muted" style={{ fontSize: 13 }}>{balance === null ? "…" : sol(balance)} SOL</span>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => disconnect()} title="Disconnect">
              <Icon n="sign-out" />
            </button>
          </div>
        </>
      }
    >
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "232px minmax(0,1fr)" }}>
        <aside style={{ padding: "var(--space-6) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)", background: "linear-gradient(to bottom, transparent, var(--color-divider) 48px, var(--color-divider) calc(100% - 48px), transparent) no-repeat right / 1px 100%" }}>
          <h6 className="text-muted" style={{ padding: "0 var(--space-3)", margin: "0 0 var(--space-3)" }}>
            {needsSetup ? "Setup" : { master: "Master", issuer: "License issuer", buyer: "Owner" }[role]}
          </h6>
          {!needsSetup &&
            nav.map((n) => (
              <button
                key={n.k}
                className="btn"
                style={{ justifyContent: "flex-start", gap: "var(--space-3)", padding: "var(--space-3)", background: n.on ? "var(--color-accent-900)" : "transparent", color: n.on ? "var(--color-accent-300)" : "var(--color-text)" }}
                onClick={() => ctx?.go(n.k)}
                disabled={n.k === "editor" && !myIssuer?.active}
              >
                <Icon n={n.icon} size={17} />
                <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{n.count}</span>
              </button>
            ))}
          <div className="text-muted" style={{ marginTop: "auto", padding: "var(--space-3)", fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
            <span>
              Signed in as <span className="mono" title="Copy address" style={{ cursor: "pointer" }} onClick={() => copy(me.toBase58())}>{copied === me.toBase58() ? "Copied" : short(me)}</span>
            </span>
            <span className="mono text-muted" title="Copy address" style={{ cursor: "pointer" }} onClick={() => copy(PROGRAM_ID.toBase58())}>
              Program {copied === PROGRAM_ID.toBase58() ? "Copied" : short(PROGRAM_ID)}
            </span>
          </div>
        </aside>

        <main style={{ padding: "calc(var(--space-8)*1.5) calc(var(--space-8)*2) calc(var(--space-8)*3)", maxWidth: 1180, display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          {loadErr && (
            <div className="card" style={{ padding: "var(--space-4) var(--space-6)", fontSize: 13, flexDirection: "row", gap: "var(--space-3)", alignItems: "center" }}>
              <Icon n="warning" size={18} style={{ color: "var(--color-accent-300)" }} />
              <span style={{ flex: 1 }}>Couldn't reach the cluster: {loadErr}</span>
              <button className="btn btn-secondary" onClick={refresh}>Retry</button>
            </div>
          )}
          {!chain && !loadErr && <p className="text-muted">Loading on-chain state…</p>}
          {ctx && needsSetup && <Setup ctx={ctx} />}
          {ctx && !needsSetup && (
            <>
              {role === "master" && screen === "issuers" && <Master.Issuers ctx={ctx} />}
              {role === "master" && screen === "fees" && <Master.Fees ctx={ctx} />}
              {role === "issuer" && myIssuer && screen === "types" && <Issuer.Types ctx={ctx} />}
              {role === "issuer" && myIssuer && screen === "editor" && <Issuer.Editor key={editing ?? "new"} ctx={ctx} />}
              {role === "issuer" && myIssuer && screen === "payouts" && <Issuer.Payouts ctx={ctx} />}
              {role === "buyer" && screen === "browse" && <Buyer.Browse ctx={ctx} />}
              {role === "buyer" && screen === "mine" && <Buyer.Mine ctx={ctx} />}
            </>
          )}
        </main>
      </div>
      {dialog && !tx && dialog}
      {tx && (
        <TxModal
          tx={tx}
          onDone={() => setTx(null)}
          onRetry={() => lastTx.current && runTx(lastTx.current)}
        />
      )}
    </Shell>
  );
}

function Shell({ right, children }: { right?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(1200px 500px at 0% -10%, var(--color-accent-900), transparent 70%), var(--color-bg)" }}>
      <header className="nav" style={{ padding: "var(--space-4) var(--space-8)", gap: "var(--space-6)" }}>
        <a href="#" className="nav-brand" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", color: "var(--color-text)", textDecoration: "none" }}>
          <span style={{ width: 26, height: 26, borderRadius: "var(--radius-md)", border: "1px solid var(--color-accent)", display: "grid", placeItems: "center", color: "var(--color-accent)" }}>
            <Icon n="key" size={15} />
          </span>
          <span>Horkos</span>
          <span className="tag tag-neutral" style={{ fontSize: 10, textTransform: "capitalize" }}>{CLUSTER.replace("-beta", "")}</span>
        </a>
        {right}
      </header>
      {children}
    </div>
  );
}

function Setup({ ctx }: { ctx: Ctx }) {
  return (
    <div className="card elev-md" style={{ padding: "var(--space-8)", gap: "var(--space-4)", maxWidth: 560 }}>
      <span className="card-kicker">First run</span>
      <div className="card-title" style={{ fontSize: 22 }}>Initialize the license program</div>
      <p className="card-body">
        The program at <span className="mono">{short(PROGRAM_ID)}</span> has no configuration yet. Initializing makes the connected wallet the master account: it sets the issuer fee, can revoke issuers, and receives issuer fees and the 0.1% operation fee.
      </p>
      <button
        className="btn btn-primary"
        style={{ alignSelf: "flex-start" }}
        onClick={() =>
          ctx.runTx({
            kicker: "Initialize",
            title: "Become master account",
            detail: short(ctx.me),
            ixs: async () => [await ctx.program.methods.initConfig().accountsPartial({ master: ctx.me, config: configPda() }).instruction()],
          })
        }
      >
        <Icon n="crown-simple" />
        Initialize as master
      </button>
    </div>
  );
}
