import { useState } from "react";
import { configPda, DAY, explorerAddr, licensePda, NETWORK_FEE, type LicenseAcc, type TypeAcc } from "../chain";
import type { Ctx } from "../ctx";
import { dt, period, short, sol, span } from "../format";
import { Bar, Dialog, Icon, PageHead, Seg, Stat } from "../ui";

function buy(ctx: Ctx, t: TypeAcc) {
  const iss = ctx.issuerOf(t)!;
  const name = ctx.typeName(t);
  const feePct = ((ctx.chain.cfg?.feeBps ?? 10) / 100).toLocaleString("en-US");
  ctx.openDlg(
    <Dialog
      icon="shopping-bag"
      title={name}
      body={ctx.issuerName(iss) + " · " + period(t.duration) + " license. Your payment is held in escrow by the license account until the refund window ends."}
      stops={[
        { k: "Today", v: dt(ctx.now) },
        { k: "Full refund until", v: dt(ctx.now + t.resign) },
        { k: "Expires", v: dt(ctx.now + t.duration) },
      ]}
      rows={[
        { k: "License price", v: sol(t.price) + " SOL" },
        { k: "Operation fee (" + feePct + "%, paid by issuer)", v: "included" },
        { k: "License account rent · refunded if you resign", v: sol(ctx.chain.rents.license) + " SOL" },
        { k: "Network fee", v: "≈ " + sol(NETWORK_FEE) + " SOL" },
      ]}
      total={{ k: "Total", v: sol(t.price + ctx.chain.rents.license + NETWORK_FEE) + " SOL" }}
      cta="Buy license"
      disabled={ctx.balance !== null && ctx.balance < t.price + ctx.chain.rents.license + NETWORK_FEE}
      onClose={ctx.closeDlg}
      confirm={() =>
        ctx.runTx({
          kicker: "Purchase",
          title: name,
          detail: sol(t.price) + " SOL · " + ctx.issuerName(iss),
          ixs: async () => [
            await ctx.program.methods
              .purchase()
              .accountsPartial({ owner: ctx.me, issuer: iss.pda, licenseType: t.pda, license: licensePda(t.pda, ctx.me) })
              .instruction(),
          ],
          after: () => ctx.go("mine"),
        })
      }
    />,
  );
}

export function Browse({ ctx }: { ctx: Ctx }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const owned = new Set(ctx.chain.licenses.filter((l) => l.owner.equals(ctx.me)).map((l) => l.type.toBase58()));
  const market = ctx.chain.types
    .filter((t) => t.active && ctx.issuerOf(t)?.active)
    .filter((t) => !q || (ctx.typeName(t) + " " + ctx.issuerName(ctx.issuerOf(t))).toLowerCase().includes(q));
  return (
    <>
      <PageHead title="Browse licenses" sub="Every license comes with a refund window set by its issuer.">
        <div style={{ position: "relative", width: 280 }}>
          <Icon n="magnifying-glass" style={{ position: "absolute", left: 11, top: 11 }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Search software or issuer" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "var(--space-6)" }}>
        {market.map((t) => {
          const own = owned.has(t.pda.toBase58());
          const m = ctx.meta.typeMeta(t.pda.toBase58(), t.id.toString());
          return (
            <div key={t.pda.toBase58()} className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="card-kicker">{ctx.issuerName(ctx.issuerOf(t))}</span>
                {own && <span className="tag tag-outline">Owned</span>}
              </div>
              <div>
                <div className="card-title">{m.name}</div>
                <p className="card-body" style={{ marginTop: "var(--space-2)" }}>{m.desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}>{sol(t.price)}</span>
                <span className="text-muted">SOL / {period(t.duration)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  <Icon n="arrow-counter-clockwise" /> Refundable for {span(t.resign)}
                </span>
                <button className="btn btn-primary" onClick={() => (own ? ctx.go("mine") : buy(ctx, t))}>{own ? "View" : "Buy"}</button>
              </div>
            </div>
          );
        })}
      </div>
      {!market.length && <p className="text-muted">{q ? "No licenses match “" + query + "”." : "No licenses are on sale yet."}</p>}
    </>
  );
}

function resign(ctx: Ctx, l: LicenseAcc, t: TypeAcc) {
  const name = ctx.typeName(t);
  const closes = l.prevExpiresAt <= ctx.now;
  const refund = l.paid + (closes ? ctx.chain.rents.license : 0);
  ctx.openDlg(
    <Dialog
      icon="arrow-counter-clockwise"
      title={"Resign from " + name + "?"}
      body={
        closes
          ? "Your license ends immediately and its account is closed. Refunds are available until " + dt(l.resignDeadline) + "."
          : "Your latest renewal is cancelled and refunded. The license falls back to its previous expiry, " + dt(l.prevExpiresAt) + "."
      }
      rows={[
        { k: "Refunded from escrow", v: "+" + sol(l.paid) + " SOL" },
        ...(closes ? [{ k: "Account rent returned", v: "+" + sol(ctx.chain.rents.license) + " SOL" }] : []),
        { k: "Network fee", v: "≈ " + sol(NETWORK_FEE) + " SOL" },
      ]}
      total={{ k: "You receive", v: sol(refund) + " SOL" }}
      cta="Resign & refund"
      onClose={ctx.closeDlg}
      confirm={() =>
        ctx.runTx({
          kicker: "Resign",
          title: name,
          detail: "Refund " + sol(refund) + " SOL",
          ixs: async () => [await ctx.program.methods.resign().accountsPartial({ owner: ctx.me, licenseType: t.pda, license: l.pda }).instruction()],
        })
      }
    />,
  );
}

function renew(ctx: Ctx, l: LicenseAcc, t: TypeAcc) {
  const name = ctx.typeName(t);
  const iss = ctx.issuerOf(t)!;
  const cfg = ctx.chain.cfg!;
  const newExp = Math.max(l.expiresAt, ctx.now) + t.duration;
  ctx.openDlg(
    <Dialog
      icon="arrows-clockwise"
      title={"Renew " + name}
      body={
        l.expiresAt > ctx.now
          ? "Renewal extends from your current expiry, so you don't lose the time you have left. You get a fresh refund window for this payment."
          : "Your license has expired. Renewing starts a new period from today."
      }
      stops={[
        { k: "Current expiry", v: dt(l.expiresAt) },
        { k: "Refund until", v: dt(ctx.now + t.resign) },
        { k: "New expiry", v: dt(newExp) },
      ]}
      rows={[
        { k: "Price (" + period(t.duration) + ")", v: sol(t.price) + " SOL" },
        ...(t.price !== l.paid && l.paid > 0 ? [{ k: "You paid last period", v: sol(l.paid) + " SOL" }] : []),
        { k: "Network fee", v: "≈ " + sol(NETWORK_FEE) + " SOL" },
      ]}
      total={{ k: "Total", v: sol(t.price + NETWORK_FEE) + " SOL" }}
      cta={"Renew for " + sol(t.price) + " SOL"}
      disabled={ctx.balance !== null && ctx.balance < t.price + NETWORK_FEE}
      onClose={ctx.closeDlg}
      confirm={() =>
        ctx.runTx({
          kicker: "Renew",
          title: name,
          detail: "Until " + dt(newExp),
          ixs: async () => [
            await ctx.program.methods
              .renew()
              .accountsPartial({ owner: ctx.me, config: configPda(), master: cfg.master, issuer: iss.pda, authority: iss.authority, licenseType: t.pda, license: l.pda })
              .instruction(),
          ],
        })
      }
    />,
  );
}

export function Mine({ ctx }: { ctx: Ctx }) {
  const [view, setView] = useState<"cards" | "timeline">("cards");
  const now = ctx.now;
  const mine = ctx.chain.licenses
    .filter((l) => l.owner.equals(ctx.me))
    .flatMap((l) => {
      const t = ctx.type(l.type);
      return t ? [{ l, t }] : [];
    })
    .sort((a, b) => b.l.expiresAt - a.l.expiresAt);

  const items = mine.map(({ l, t }) => {
    const iss = ctx.issuerOf(t);
    const paidAt = l.resignDeadline - t.resign;
    const start = Math.min(paidAt, l.prevExpiresAt);
    const spanS = Math.max(l.expiresAt - start, 1);
    const expired = l.expiresAt <= now;
    const refundable = l.paid > 0 && now <= l.resignDeadline;
    const soon = !expired && l.expiresAt - now <= 30 * DAY;
    const saleOpen = t.active && !!iss?.active;
    const canRenew = now > l.resignDeadline && saleOpen;
    const status = expired ? "Expired" : refundable ? "Refundable · " + span(l.resignDeadline - now) : soon ? "Expires in " + span(l.expiresAt - now) : "Active";
    return {
      l, t, iss, start, expired, refundable, soon, canRenew, status,
      renewNote: !saleOpen ? "No longer sold by issuer" : refundable ? "Renew after refund window" : "",
      resW: refundable || l.resignDeadline > start ? Math.max(((Math.min(l.resignDeadline, l.expiresAt) - start) / spanS) * 100, 1.5) : 0,
      nowW: Math.min(Math.max(((now - start) / spanS) * 100, 0), 100),
      fill: expired ? "var(--color-neutral-600)" : soon ? "var(--color-accent-400)" : "var(--color-accent)",
    };
  });

  const gMin = Math.min(now - 30 * DAY, ...items.map((x) => x.start));
  const gMax = Math.max(now + 60 * DAY, ...items.map((x) => x.l.expiresAt));
  const gR = gMax - gMin;
  const gp = (v: number) => ((v - gMin) / gR) * 100;
  const ticks = [0.1, 0.5, 0.9].map((p) => {
    const v = gMin + gR * p;
    const d = new Date(v * 1000);
    return { left: gp(v), l: d.toLocaleDateString("en-US", { month: "short" }) + " ’" + String(d.getFullYear()).slice(2) };
  });

  const actions = (x: (typeof items)[number], compact: boolean) => (
    <>
      {x.canRenew && (
        <button className={"btn " + (compact ? "btn-secondary" : "btn-primary")} style={compact ? { fontSize: 12 } : undefined} onClick={() => renew(ctx, x.l, x.t)}>
          {!compact && <Icon n="arrows-clockwise" />}
          Renew
        </button>
      )}
      {x.refundable && (
        <button className={"btn " + (compact ? "btn-ghost" : "btn-secondary")} style={compact ? { fontSize: 12 } : undefined} onClick={() => resign(ctx, x.l, x.t)}>
          {!compact && <Icon n="arrow-counter-clockwise" />}
          {compact ? "Refund" : "Resign & refund"}
        </button>
      )}
      {!compact && !x.canRenew && x.renewNote && (
        <span className="text-muted" style={{ fontSize: 12, alignSelf: "center" }}>{x.renewNote}</span>
      )}
    </>
  );

  return (
    <>
      <PageHead title="My licenses" sub={mine.length + (mine.length === 1 ? " license" : " licenses") + " in wallet " + short(ctx.me)}>
        <Seg
          name="lv"
          value={view}
          opts={[{ v: "cards", l: "Cards", icon: "cards" }, { v: "timeline", l: "Timeline", icon: "chart-bar-horizontal" }]}
          onPick={setView}
        />
      </PageHead>

      {view === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(420px,1fr))", gap: "var(--space-6)" }}>
          {items.map((x) => (
            <div key={x.l.pda.toBase58()} className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-4)", opacity: x.expired ? 0.75 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="card-kicker">{ctx.issuerName(x.iss)}</span>
                <span className={"tag " + (x.expired ? "tag-neutral" : x.soon ? "tag-outline" : "tag-accent")}>{x.status}</span>
              </div>
              <div className="card-title" style={{ fontSize: 20 }}>{ctx.typeName(x.t)}</div>
              <div style={{ display: "flex", gap: "var(--space-8)", fontSize: 13 }}>
                <Stat k={x.l.paid ? "In escrow" : "Paid"} v={x.l.paid ? sol(x.l.paid) + " SOL" : "Settled"} />
                <Stat k={x.expired ? "Expired" : "Expires"} v={dt(x.l.expiresAt)} />
                <Stat
                  k="License account"
                  v={
                    <a href={explorerAddr(x.l.pda)} target="_blank" rel="noreferrer" className="mono" style={{ textDecoration: "none" }}>
                      {short(x.l.pda)}
                    </a>
                  }
                />
              </div>
              <Bar resW={x.resW} nowW={x.nowW} fill={x.fill} />
              <div className="text-muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span>Period from {dt(x.start, false)}</span>
                <span>{x.refundable ? "Refund until " + dt(x.l.resignDeadline, false) : ""}</span>
                <span>{(x.expired ? "Ended " : "Expires ") + dt(x.l.expiresAt)}</span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>{actions(x, false)}</div>
            </div>
          ))}
        </div>
      )}

      {view === "timeline" && items.length > 0 && (
        <div className="card" style={{ padding: "var(--space-6) var(--space-8)", gap: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(120px,180px) minmax(0,1fr) 150px", gap: "var(--space-4)", paddingBottom: "var(--space-3)" }}>
            <span />
            <div style={{ position: "relative", height: 16 }}>
              {ticks.map((k, i) => (
                <span key={i} className="text-muted" style={{ position: "absolute", left: k.left + "%", fontSize: 11, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>{k.l}</span>
              ))}
            </div>
            <span />
          </div>
          {items.map((x) => (
            <div key={x.l.pda.toBase58()} className="rule-row" style={{ display: "grid", gridTemplateColumns: "minmax(120px,180px) minmax(0,1fr) 150px", gap: "var(--space-4)", alignItems: "center", padding: "var(--space-4) 0" }}>
              <div>
                <div style={{ fontSize: 14 }}>{ctx.typeName(x.t)}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{ctx.issuerName(x.iss)} · {x.status}</div>
              </div>
              <div style={{ position: "relative", height: 22 }}>
                <div style={{ position: "absolute", left: gp(now) + "%", top: -14, bottom: -14, width: 1, background: "var(--color-accent)" }} />
                <div
                  style={{
                    position: "absolute",
                    left: gp(x.start) + "%",
                    width: ((x.l.expiresAt - x.start) / gR) * 100 + "%",
                    top: 4,
                    height: 14,
                    borderRadius: "var(--radius-sm)",
                    background: x.expired ? "var(--color-neutral-800)" : "var(--color-accent-800)",
                    boxShadow: "inset 0 0 0 1px " + (x.expired ? "var(--color-neutral-700)" : "var(--color-accent-700)"),
                  }}
                />
                {x.refundable && (
                  <div
                    title="Refund window"
                    style={{
                      position: "absolute",
                      left: gp(x.l.resignDeadline - x.t.resign) + "%",
                      width: Math.max((x.t.resign / gR) * 100, 0.6) + "%",
                      top: 4,
                      height: 14,
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent-700)",
                    }}
                  />
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>{actions(x, true)}</div>
            </div>
          ))}
          <div className="text-muted" style={{ display: "flex", gap: "var(--space-6)", fontSize: 11, paddingTop: "var(--space-4)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, height: 8, borderRadius: 2, background: "var(--color-accent-700)" }} />
              Refund window
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, height: 8, borderRadius: 2, background: "var(--color-accent-800)" }} />
              Active
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 1, height: 12, background: "var(--color-accent)" }} />
              Today · {dt(now)}
            </span>
          </div>
        </div>
      )}

      {!mine.length && (
        <div className="card" style={{ padding: "var(--space-8)", alignItems: "flex-start", gap: "var(--space-4)" }}>
          <div className="card-title">No licenses yet</div>
          <button className="btn btn-primary" onClick={() => ctx.go("browse")}>Browse licenses</button>
        </div>
      )}
    </>
  );
}
