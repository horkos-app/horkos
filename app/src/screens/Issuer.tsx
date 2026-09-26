import { useState } from "react";
import { BN } from "@anchor-lang/core";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { configPda, DAY, issuerPda, NETWORK_FEE, typePda, type LicenseAcc } from "../chain";
import type { Ctx } from "../ctx";
import { dt, period, short, sol, span } from "../format";
import { Dialog, Icon, PageHead, Seg } from "../ui";

const bytes = (s: string) => new TextEncoder().encode(s).length;

export function PurchaseDialog({ ctx }: { ctx: Ctx }) {
  const [label, setLabel] = useState("");
  const cfg = ctx.chain.cfg!;
  const total = cfg.issuerFee + ctx.chain.rents.issuer + NETWORK_FEE;
  return (
    <Dialog
      icon="storefront"
      title="Become a license issuer"
      body="Pay the one-time issuer fee to the master account. Your wallet can then create license types, set their prices and claim payouts."
      rows={[
        { k: "Instruction", v: "purchase_issuer" },
        { k: "Issuer fee", v: sol(cfg.issuerFee) + " SOL" },
        { k: "Issuer account rent", v: sol(ctx.chain.rents.issuer) + " SOL" },
        { k: "Network fee", v: "≈ " + sol(NETWORK_FEE) + " SOL" },
      ]}
      cta={"Pay " + sol(cfg.issuerFee) + " SOL"}
      disabled={(ctx.balance !== null && ctx.balance < total) || bytes(label.trim()) > 64}
      onClose={ctx.closeDlg}
      confirm={() => {
        const name = label.trim();
        ctx.runTx({
          kicker: "Purchase issuer",
          title: name || "New issuer",
          detail: short(ctx.me),
          ixs: async () => [
            await ctx.program.methods.purchaseIssuer(name).accountsPartial({ authority: ctx.me, master: cfg.master, config: configPda(), issuer: issuerPda(ctx.me) }).instruction(),
          ],
        });
      }}
    >
      <div className="field">
        <label>Name (stored on-chain)</label>
        <input className="input" placeholder="e.g. Kettle Dev Tools" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
    </Dialog>
  );
}

const RevokedNote = () => (
  <div className="card" style={{ padding: "var(--space-4) var(--space-6)", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", fontSize: 13 }}>
    <Icon n="prohibit" size={18} style={{ color: "var(--color-accent-300)" }} />
    Your issuer privileges were revoked. You can still claim payouts for licenses you already sold.
  </div>
);

export function Types({ ctx }: { ctx: Ctx }) {
  const iss = ctx.myIssuer!;
  const mine = ctx.chain.types.filter((t) => t.issuer.equals(iss.pda));
  return (
    <>
      <PageHead title="License types" sub={ctx.issuerName(iss) + " · price changes apply to new sales and renewals, not to licenses already paid for."}>
        <button className="btn btn-primary" onClick={() => ctx.go("editor")} disabled={!iss.active}>
          <Icon n="plus" />
          New license type
        </button>
      </PageHead>
      {!iss.active && <RevokedNote />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "var(--space-6)" }}>
        {mine.map((t) => {
          const ls = ctx.licensesOf(t);
          return (
            <div key={t.pda.toBase58()} className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={"tag " + (t.active ? "tag-accent" : "tag-neutral")}>{t.active ? "On sale" : "Paused"}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{ls.length} active accounts</span>
              </div>
              <div>
                <div className="card-title">{t.name}</div>
                <p className="card-body" style={{ marginTop: "var(--space-2)" }}>{t.desc || <span className="text-muted">No description</span>}</p>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}>{sol(t.price)}</span>
                <span className="text-muted">SOL / {period(t.duration)}</span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-6)", fontSize: 12 }} className="text-muted">
                <span><Icon n="arrow-counter-clockwise" /> {span(t.resign)} refund window</span>
                <span><Icon n="coins" /> {sol(ls.reduce((a, l) => a + l.paid, 0))} SOL in escrow</span>
              </div>
              <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }} onClick={() => ctx.go("editor", t.pda.toBase58())} disabled={!iss.active}>
                <Icon n="pencil-simple" />
                Edit
              </button>
            </div>
          );
        })}
      </div>
      {!mine.length && (
        <div className="card" style={{ padding: "var(--space-8)", alignItems: "flex-start", gap: "var(--space-4)" }}>
          <div className="card-title">No license types yet</div>
          <button className="btn btn-primary" onClick={() => ctx.go("editor")} disabled={!iss.active}>Create your first license type</button>
        </div>
      )}
    </>
  );
}

const DURS = [1, 30, 90, 365];
const toLamports = (s: string) => Math.round(parseFloat(s) * LAMPORTS_PER_SOL);
const trimNum = (v: number) => String(Math.round(v * 1e6) / 1e6);

export function Editor({ ctx }: { ctx: Ctx }) {
  const iss = ctx.myIssuer!;
  const editing = ctx.editing ? ctx.chain.types.find((t) => t.pda.toBase58() === ctx.editing) : undefined;
  const m0 = editing ? { name: editing.name, desc: editing.desc } : { name: "", desc: "" };
  const [f, setF] = useState(() => ({
    name: editing ? m0.name : "",
    desc: m0.desc,
    price: editing ? trimNum(editing.price / LAMPORTS_PER_SOL) : "",
    dur: editing ? editing.duration / DAY : 365,
    res: editing ? trimNum(editing.resign / DAY) : "14",
    active: editing?.active ?? true,
  }));
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));

  const price = toLamports(f.price);
  const durSecs = Math.round(f.dur * DAY);
  const resSecs = Math.round(parseFloat(f.res) * DAY);
  const invalid = !(price > 0) || !f.name.trim() || bytes(f.name.trim()) > 64 || bytes(f.desc.trim()) > 256 || !(resSecs > 0) || resSecs > durSecs;
  const chainChanged = !!editing && (price !== editing.price || durSecs !== editing.duration || resSecs !== editing.resign || f.active !== editing.active);
  const metaChanged = !!editing && (f.name.trim() !== m0.name || f.desc.trim() !== m0.desc);
  const durOpts = [...new Set([...DURS, ...(editing ? [editing.duration / DAY] : [])])].sort((a, b) => a - b);
  const safePrice = price > 0 ? price : 0;
  const fee = Math.floor((safePrice * (ctx.chain.cfg?.feeBps ?? 10)) / 10_000);
  const sold = editing ? ctx.licensesOf(editing).length : 0;

  const save = () => {
    const meta = { name: f.name.trim(), desc: f.desc.trim() };
    if (editing) {
      ctx.runTx({
        kicker: "Update license type",
        title: meta.name,
        detail: price !== editing.price ? sol(editing.price) + " → " + sol(price) + " SOL" : "Terms updated",
        ixs: async () => [
          await ctx.program.methods
            .updateLicenseType(new BN(price), new BN(durSecs), new BN(resSecs), f.active, meta.name, meta.desc)
            .accountsPartial({ authority: ctx.me, issuer: iss.pda, licenseType: editing.pda })
            .instruction(),
        ],
        after: () => ctx.go("types"),
      });
      return;
    }
    const ids = ctx.chain.types.filter((t) => t.issuer.equals(iss.pda)).map((t) => t.id);
    const id = ids.reduce((a, b) => (b.gt(a) ? b : a), new BN(0)).addn(1);
    const pda = typePda(iss.pda, id);
    ctx.runTx({
      kicker: "Create license type",
      title: meta.name,
      detail: sol(price) + " SOL / " + period(durSecs),
      ixs: async () => [
        await ctx.program.methods
          .createLicenseType(id, new BN(price), new BN(durSecs), new BN(resSecs), meta.name, meta.desc)
          .accountsPartial({ authority: ctx.me, issuer: iss.pda, licenseType: pda })
          .instruction(),
      ],
      after: () => ctx.go("types"),
    });
  };

  return (
    <>
      <div>
        <button className="btn btn-ghost" style={{ fontSize: 13, marginBottom: "var(--space-3)" }} onClick={() => ctx.go("types")}>
          <Icon n="arrow-left" />
          License types
        </button>
        <h2 style={{ margin: 0 }}>{editing ? "Edit " + m0.name : "New license type"}</h2>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>
          {editing ? sold + " license accounts · new terms apply to future purchases and renewals" : "Create a license type buyers can purchase with SOL."}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)", gap: "calc(var(--space-8)*1.5)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div className="field">
            <label>Name</label>
            <input className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Arcwise IDE Pro" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="input" value={f.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="What the license unlocks" />
          </div>
          <div className="field">
            <label>Price (SOL)</label>
            <div style={{ position: "relative" }}>
              <input className="input" style={{ fontSize: 20, minHeight: 48, paddingRight: 56 }} value={f.price} onChange={(e) => set({ price: e.target.value })} inputMode="decimal" />
              <span className="text-muted" style={{ position: "absolute", right: 14, top: 13 }}>SOL</span>
            </div>
            {editing && price > 0 && price !== editing.price && (
              <div style={{ fontSize: 12, color: "var(--color-accent-300)", marginTop: 6 }}>
                <Icon n="info" /> New buyers and renewals pay {sol(price)} SOL. Payments already in escrow stay at {sol(editing.price)} SOL.
              </div>
            )}
          </div>
          <div className="field">
            <label>License duration</label>
            <Seg name="dur" value={f.dur} opts={durOpts.map((d) => ({ v: d, l: period(Math.round(d * DAY)) === "month" ? "30 days" : period(Math.round(d * DAY)) }))} onPick={(d) => set({ dur: d })} />
          </div>
          <div className="field">
            <label>Resignation period (days) — owners can resign for a full refund within this window</label>
            <input className="input" style={{ maxWidth: 160 }} value={f.res} onChange={(e) => set({ res: e.target.value })} inputMode="decimal" />
            {resSecs > durSecs && <div style={{ fontSize: 12, color: "var(--color-accent-300)", marginTop: 6 }}>The refund window can't be longer than the license duration.</div>}
          </div>
          {editing && (
            <div className="field">
              <label>Availability</label>
              <Seg name="active" value={f.active ? 1 : 0} opts={[{ v: 1, l: "On sale", icon: "storefront" }, { v: 0, l: "Paused", icon: "pause" }]} onPick={(v) => set({ active: v === 1 })} />
            </div>
          )}
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button className="btn btn-primary" onClick={save} disabled={invalid || (!!editing && !chainChanged && !metaChanged)}>
              {editing ? (chainChanged ? "Update license type" : "Save") : "Create license type"}
            </button>
            <button className="btn btn-secondary" onClick={() => ctx.go("types")}>Cancel</button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", position: "sticky", top: "var(--space-6)" }}>
          <h6 className="text-muted" style={{ margin: 0 }}>Buyer preview</h6>
          <div className="card elev-md" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
            <span className="card-kicker">{ctx.issuerName(iss)}</span>
            <div className="card-title" style={{ fontSize: 20 }}>{f.name || "Untitled license"}</div>
            <p className="card-body">{f.desc || "Description shown to buyers."}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 500 }}>{sol(safePrice)}</span>
              <span className="text-muted">SOL / {period(durSecs)}</span>
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              <Icon n="arrow-counter-clockwise" /> Refundable for {span(resSecs > 0 ? resSecs : 0)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: 13, padding: "var(--space-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">You receive per sale</span>
              <span>{sol(safePrice - fee)} SOL</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Operation fee ({((ctx.chain.cfg?.feeBps ?? 10) / 100).toLocaleString("en-US")}%)</span>
              <span>{sol(fee)} SOL</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Claimable after</span>
              <span>{span(resSecs > 0 ? resSecs : 0)} from purchase</span>
            </div>
            {!editing && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-muted">Account rent (you pay once)</span>
                <span>{sol(ctx.chain.rents.type)} SOL</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const CLAIM_BATCH = 8;

export function Payouts({ ctx }: { ctx: Ctx }) {
  const iss = ctx.myIssuer!;
  const cfg = ctx.chain.cfg!;
  const myTypes = ctx.chain.types.filter((t) => t.issuer.equals(iss.pda));
  const sales = myTypes.flatMap((t) => ctx.licensesOf(t).map((l) => ({ l, t })));
  const net = (l: LicenseAcc) => l.paid - Math.floor((l.paid * cfg.feeBps) / 10_000);
  const claimable = sales.filter(({ l }) => l.paid > 0 && ctx.now > l.resignDeadline);
  const locked = sales.filter(({ l }) => l.paid > 0 && ctx.now <= l.resignDeadline).sort((a, b) => a.l.resignDeadline - b.l.resignDeadline);
  const batch = claimable.slice(0, CLAIM_BATCH);
  const sum = (xs: typeof sales) => xs.reduce((a, { l }) => a + net(l), 0);
  const horizon = Math.max(30 * DAY, ...locked.map(({ l }) => l.resignDeadline - ctx.now));

  const claim = (xs: typeof sales) =>
    ctx.runTx({
      kicker: "Claim payout",
      title: sol(sum(xs)) + " SOL",
      detail: xs.length + (xs.length === 1 ? " sale" : " sales") + " past their refund window",
      ixs: () =>
        Promise.all(
          xs.map(({ l, t }) =>
            ctx.program.methods
              .claim()
              .accountsPartial({ authority: ctx.me, config: configPda(), master: cfg.master, issuer: iss.pda, licenseType: t.pda, license: l.pda })
              .instruction(),
          ),
        ),
    });

  const rows = [...sales].sort((a, b) => b.l.paid - a.l.paid || a.l.resignDeadline - b.l.resignDeadline);
  return (
    <>
      <PageHead title="Payouts" sub="Sale proceeds unlock when each buyer's resignation period ends.">
        <button className="btn btn-primary" onClick={() => claim(batch)} disabled={!batch.length}>
          <Icon n="hand-coins" />
          Claim {sol(sum(batch))} SOL
        </button>
      </PageHead>
      {claimable.length > CLAIM_BATCH && (
        <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>Claims are sent {CLAIM_BATCH} at a time; {claimable.length - CLAIM_BATCH} more will remain claimable.</p>
      )}
      <div className="card" style={{ padding: "var(--space-6) var(--space-8) var(--space-8)", gap: "var(--space-6)" }}>
        <div style={{ display: "flex", gap: "calc(var(--space-8)*2)" }}>
          <div>
            <div className="card-kicker">Claimable now</div>
            <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em" }}>
              {sol(sum(claimable))} <span className="text-muted" style={{ fontSize: 15 }}>SOL</span>
            </div>
          </div>
          <div>
            <div className="card-kicker" style={{ color: "var(--color-neutral-400)" }}>Locked in refund windows</div>
            <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--color-neutral-300)" }}>
              {sol(sum(locked))} <span className="text-muted" style={{ fontSize: 15 }}>SOL</span>
            </div>
          </div>
        </div>
        <div style={{ position: "relative", height: 92, margin: "0 var(--space-4) 0 var(--space-6)" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 50, height: 2, background: "linear-gradient(to right, var(--color-accent), var(--color-neutral-800) 12%, var(--color-neutral-800) 90%, transparent)" }} />
          <div style={{ position: "absolute", left: 0, top: 43 }}>
            <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", background: "var(--color-accent)", boxShadow: "0 0 0 5px var(--color-accent-900), 0 0 18px var(--color-accent)" }} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 70, fontSize: 11, color: "var(--color-accent-300)" }}>Today</div>
          {locked.slice(0, 12).map(({ l }) => (
            <div
              key={l.pda.toBase58()}
              style={{ position: "absolute", left: Math.min(Math.max(((l.resignDeadline - ctx.now) / horizon) * 100, 9), 96) + "%", top: 0, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap" }}
            >
              <span>{sol(net(l))}</span>
              <span style={{ width: 1, height: 20, background: "var(--color-neutral-700)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid var(--color-neutral-400)", background: "var(--color-bg)" }} />
              <span className="text-muted" style={{ fontSize: 11 }}>{dt(l.resignDeadline, false)}</span>
            </div>
          ))}
          <div className="text-muted" style={{ position: "absolute", right: 0, top: 0, fontSize: 11 }}>+{span(horizon)}</div>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Buyer</th>
            <th>License type</th>
            <th>Net amount</th>
            <th>Refund window ends</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ l, t }) => {
            const st = l.paid === 0 ? "settled" : ctx.now > l.resignDeadline ? "claimable" : "locked";
            return (
              <tr key={l.pda.toBase58()}>
                <td className="mono" style={{ fontSize: 13 }}>{short(l.owner)}</td>
                <td>{ctx.typeName(t)}</td>
                <td>{l.paid ? sol(net(l)) + " SOL" : "—"}</td>
                <td className="text-muted">{dt(l.resignDeadline)}</td>
                <td>
                  <span className={"tag " + { claimable: "tag-accent", locked: "tag-outline", settled: "tag-neutral" }[st]}>
                    {{ claimable: "Claimable", locked: "Locked · " + span(l.resignDeadline - ctx.now), settled: "Settled" }[st]}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  {st === "claimable" && <button className="btn btn-ghost" onClick={() => claim([{ l, t }])}>Claim</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <p className="text-muted">No sales yet.</p>}
    </>
  );
}
