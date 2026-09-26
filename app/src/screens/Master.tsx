import { useEffect, useState } from "react";
import { BN } from "@anchor-lang/core";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { configPda, DAY, explorerAddr, explorerTx, fetchFeeEvents, NETWORK_FEE, type FeeEvent, type IssuerAcc } from "../chain";
import type { Ctx } from "../ctx";
import { dt, initials, short, sol } from "../format";
import { Dialog, Icon, PageHead } from "../ui";

function FeeDialog({ ctx }: { ctx: Ctx }) {
  const cur = ctx.chain.cfg!.issuerFee;
  const [v, setV] = useState(String(cur / LAMPORTS_PER_SOL));
  const fee = Math.round(parseFloat(v) * LAMPORTS_PER_SOL);
  return (
    <Dialog
      icon="coins"
      title="Set issuer fee"
      body="One-time price a wallet pays you to become a license issuer. Existing issuers are not affected."
      rows={[
        { k: "Instruction", v: "update_config" },
        { k: "Current fee", v: sol(cur) + " SOL" },
        { k: "Network fee", v: "≈ " + sol(NETWORK_FEE) + " SOL" },
      ]}
      cta="Update fee"
      disabled={!(fee >= 0) || fee === cur}
      onClose={ctx.closeDlg}
      confirm={() =>
        ctx.runTx({
          kicker: "Issuer fee",
          title: sol(fee) + " SOL",
          detail: sol(cur) + " → " + sol(fee) + " SOL",
          ixs: async () => [await ctx.program.methods.updateConfig(new BN(fee)).accountsPartial({ master: ctx.me, config: configPda() }).instruction()],
        })
      }
    >
      <div className="field">
        <label>Fee (SOL)</label>
        <input className="input" value={v} onChange={(e) => setV(e.target.value)} inputMode="decimal" />
      </div>
    </Dialog>
  );
}

function toggleIssuer(ctx: Ctx, i: IssuerAcc) {
  const rv = i.active;
  const name = ctx.issuerName(i);
  ctx.openDlg(
    <Dialog
      icon={rv ? "prohibit" : "user-plus"}
      title={(rv ? "Revoke " : "Restore ") + name + "?"}
      body={
        rv
          ? "They can no longer create or edit license types, and their licenses can no longer be bought or renewed. Licenses already sold stay valid and escrowed payments stay claimable."
          : "Their license types return to the storefront and they can manage them again."
      }
      rows={[
        { k: "Wallet", v: <span className="mono">{short(i.authority)}</span> },
        { k: "Instruction", v: "update_issuer" },
        { k: "Network fee", v: "≈ " + sol(NETWORK_FEE) + " SOL" },
      ]}
      cta={rv ? "Revoke privileges" : "Restore privileges"}
      onClose={ctx.closeDlg}
      confirm={() =>
        ctx.runTx({
          kicker: rv ? "Revoke issuer" : "Restore issuer",
          title: name,
          detail: short(i.authority),
          ixs: async () => [
            await ctx.program.methods.updateIssuer(!rv).accountsPartial({ master: ctx.me, config: configPda(), issuer: i.pda }).instruction(),
          ],
        })
      }
    />,
  );
}

export function Issuers({ ctx }: { ctx: Ctx }) {
  const rows = ctx.chain.issuers.map((i) => {
    const ts = ctx.chain.types.filter((t) => t.issuer.equals(i.pda));
    const ls = ts.flatMap((t) => ctx.licensesOf(t));
    return { i, types: ts.length, licenses: ls.length, escrow: ls.reduce((a, l) => a + l.paid, 0) };
  });
  return (
    <>
      <PageHead title="License issuers" sub="Wallets allowed to create license types and collect payouts.">
        <button className="btn btn-primary" onClick={() => ctx.openDlg(<FeeDialog ctx={ctx} />)}>
          <Icon n="coins" />
          Issuer fee: {sol(ctx.chain.cfg!.issuerFee)} SOL
        </button>
      </PageHead>
      <table className="table">
        <thead>
          <tr>
            <th>Issuer</th>
            <th>License types</th>
            <th>Licenses</th>
            <th>In escrow</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ i, types, licenses, escrow }) => {
            const name = ctx.issuerName(i);
            return (
              <tr key={i.pda.toBase58()}>
                <td style={{ padding: "var(--space-3) var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ width: 30, height: 30, borderRadius: "var(--radius-md)", background: "var(--color-neutral-800)", display: "grid", placeItems: "center", fontSize: 12 }}>{initials(name)}</span>
                    <div>
                      <div>{name}</div>
                      <a href={explorerAddr(i.authority)} target="_blank" rel="noreferrer" className="text-muted mono" style={{ fontSize: 12, textDecoration: "none" }}>
                        {short(i.authority)}
                      </a>
                    </div>
                  </div>
                </td>
                <td>{types}</td>
                <td>{licenses}</td>
                <td style={{ whiteSpace: "nowrap" }}>{sol(escrow)} SOL</td>
                <td>
                  <span className={"tag " + (i.active ? "tag-accent" : "tag-neutral")}>{i.active ? "Active" : "Revoked"}</span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className={"btn " + (i.active ? "btn-secondary" : "btn-ghost")} onClick={() => toggleIssuer(ctx, i)}>
                    {i.active ? "Revoke" : "Restore"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <p className="text-muted">No issuers yet. Wallets become issuers by paying the issuer fee.</p>}
    </>
  );
}

const WEEK = 7 * DAY;

export function Fees({ ctx }: { ctx: Ctx }) {
  const cfg = ctx.chain.cfg!;
  const [events, setEvents] = useState<FeeEvent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const conn = ctx.program.provider.connection;
  useEffect(() => {
    let live = true;
    fetchFeeEvents(conn, cfg)
      .then((e) => live && setEvents(e))
      .catch((e) => live && setErr(String(e?.message ?? e)));
    return () => {
      live = false;
    };
  }, [conn, cfg, ctx.chain]);

  const pending = Math.floor((ctx.chain.licenses.reduce((a, l) => a + l.paid, 0) * cfg.feeBps) / 10_000);
  const ev = events ?? [];
  const total = ev.reduce((a, e) => a + e.fee, 0);
  const weekStart = ctx.now - (ctx.now % WEEK);
  const weeks = Array.from({ length: 12 }, (_, k) => {
    const from = weekStart - (11 - k) * WEEK;
    return { from, v: ev.filter((e) => e.time >= from && e.time < from + WEEK).reduce((a, e) => a + e.fee, 0) };
  });
  const mx = Math.max(...weeks.map((w) => w.v), 1);
  const typeLabel = (e: FeeEvent) => {
    if (e.types.length !== 1) return e.types.length + " license types";
    return ctx.typeName(ctx.chain.types.find((t) => t.pda.toBase58() === e.types[0]));
  };

  return (
    <>
      <PageHead title="Operation fees" sub={(cfg.feeBps / 100).toLocaleString("en-US") + "% of every sale and renewal, paid to the master wallet when escrow is settled."} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: "var(--space-8)", alignItems: "stretch" }}>
        <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
          <span className="card-kicker">Collected, recent history</span>
          <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {events ? sol(total) : "…"} <span className="text-muted" style={{ fontSize: 18 }}>SOL</span>
          </div>
          <div className="text-muted" style={{ fontSize: 13 }}>{ev.length} fee-bearing transactions</div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Pending in escrow</span>
              <span>{sol(pending)} SOL</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Fee rate</span>
              <span>{(cfg.feeBps / 100).toLocaleString("en-US")}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Destination</span>
              <span className="mono">{short(cfg.master)}</span>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="card-kicker">Weekly fees · last 12 weeks</span>
            <span style={{ fontSize: 13 }}>
              This week <span style={{ color: "var(--color-accent-300)" }}>{sol(weeks[11].v)} SOL</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-3)", height: 170 }}>
            {weeks.map((b, k) => (
              <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 6, height: "100%" }}>
                <div
                  title={sol(b.v) + " SOL"}
                  style={{
                    width: "100%",
                    height: b.v ? (b.v / mx) * 88 + "%" : 0,
                    borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                    background: k === 11 ? "var(--color-accent-800)" : "var(--color-accent-900)",
                    borderTop: "2px solid var(--color-accent)",
                  }}
                />
                <span className="text-muted" style={{ fontSize: 10 }}>{k === 0 ? dt(b.from, false) : k === 11 ? "Now" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h4 style={{ margin: 0 }}>Recent fee events</h4>
        {err && <p style={{ color: "var(--color-accent-300)", fontSize: 13 }}>Could not load history: {err}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Event</th>
              <th>License type</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Transaction</th>
            </tr>
          </thead>
          <tbody>
            {ev.slice(0, 12).map((f) => (
              <tr key={f.sig}>
                <td className="text-muted">{f.time ? dt(f.time, false) : "—"}</td>
                <td><span className="tag tag-neutral">{f.kind}</span></td>
                <td>{typeLabel(f)}</td>
                <td>{sol(f.amount)} SOL</td>
                <td style={{ color: "var(--color-accent-300)" }}>+{sol(f.fee)} SOL</td>
                <td>
                  <a href={explorerTx(f.sig)} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 12, textDecoration: "none" }}>
                    {short(f.sig)} <Icon n="arrow-up-right" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events && !ev.length && <p className="text-muted">No fees collected yet. Fees arrive when issuers claim or owners renew.</p>}
        {!events && !err && <p className="text-muted">Loading transaction history…</p>}
      </div>
    </>
  );
}
