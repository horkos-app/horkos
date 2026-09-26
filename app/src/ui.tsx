import type { ReactNode } from "react";
import { explorerTx } from "./chain";
import { short } from "./format";

export const Icon = ({ n, size, style, spin }: { n: string; size?: number; style?: React.CSSProperties; spin?: boolean }) => (
  <i className={"ph ph-" + n + (spin ? " spin" : "")} style={{ fontSize: size, ...style }} />
);

export const PageHead = ({ title, sub, children }: { title: string; sub: ReactNode; children?: ReactNode }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-6)" }}>
    <div style={{ flex: 1 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>{sub}</p>
    </div>
    {children}
  </div>
);

export const Stat = ({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) => (
  <div>
    <div className="text-muted" style={{ fontSize: 11 }}>{k}</div>
    <div className={mono ? "mono" : undefined}>{v}</div>
  </div>
);

export const Seg = <T extends string | number>({
  name,
  value,
  opts,
  onPick,
  disabled,
}: {
  name: string;
  value: T;
  opts: { v: T; l: ReactNode; icon?: string }[];
  onPick: (v: T) => void;
  disabled?: boolean;
}) => (
  <div className="seg">
    {opts.map((o) => (
      <label key={String(o.v)} className="seg-opt" style={{ opacity: disabled && o.v !== value ? 0.45 : 1 }}>
        <input type="radio" name={name} checked={o.v === value} onChange={() => onPick(o.v)} disabled={disabled} />
        {o.icon && <Icon n={o.icon} />}
        {o.l}
      </label>
    ))}
  </div>
);

export const Bar = ({ resW, nowW, fill }: { resW: number; nowW: number; fill: string }) => (
  <div style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--color-neutral-800)", marginTop: "var(--space-2)" }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: resW + "%", borderRadius: 3, background: "var(--color-accent-700)" }} />
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: nowW + "%", borderRadius: 3, background: fill }} />
    <div style={{ position: "absolute", left: nowW + "%", top: -5, width: 2, height: 16, marginLeft: -1, background: "var(--color-text)", borderRadius: 1 }} />
  </div>
);

export type Row = { k: ReactNode; v: ReactNode };
export type Stop = { k: string; v: string };

export type DialogProps = {
  icon: string;
  title: string;
  body: ReactNode;
  stops?: Stop[];
  rows: Row[];
  total?: Row;
  cta: string;
  disabled?: boolean;
  confirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

export function Dialog(p: DialogProps) {
  return (
    <div className="dialog-backdrop" style={{ zIndex: 50 }} onClick={p.onClose}>
      <div className="dialog" style={{ width: "min(480px,100%)", padding: "var(--space-8)", gap: "var(--space-4)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Icon n={p.icon} size={22} style={{ color: "var(--color-accent)" }} />
          <div className="dialog-title">{p.title}</div>
        </div>
        <div className="dialog-body" style={{ textWrap: "pretty" }}>{p.body}</div>
        {p.children}
        {p.stops && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-2)", padding: "var(--space-4) 0 var(--space-2)", position: "relative" }}>
            <div style={{ position: "absolute", left: 6, right: 6, top: "calc(var(--space-4) + 5px)", height: 2, background: "linear-gradient(to right, var(--color-accent) 0%, var(--color-accent-700) 50%, var(--color-neutral-800) 100%)" }} />
            {p.stops.map((s, i) => {
              const align = ["flex-start", "center", "flex-end"][i] ?? "center";
              return (
                <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, alignItems: align, textAlign: (["left", "center", "right"] as const)[i] ?? "center" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-surface)", border: "2px solid var(--color-accent)" }} />
                  <span className="text-muted" style={{ fontSize: 11 }}>{s.k}</span>
                  <span style={{ fontSize: 13 }}>{s.v}</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: 13, padding: "var(--space-4)", borderRadius: "var(--radius-md)", background: "var(--color-bg)" }}>
          {p.rows.map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }}>
              <span className="text-muted">{w.k}</span>
              <span style={{ whiteSpace: "nowrap" }}>{w.v}</span>
            </div>
          ))}
          {p.total && (
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "var(--space-3)", marginTop: "var(--space-1)", borderTop: "1px solid var(--color-divider)", fontSize: 15 }}>
              <span>{p.total.k}</span>
              <span style={{ color: "var(--color-accent-300)" }}>{p.total.v}</span>
            </div>
          )}
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={p.onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={p.confirm} disabled={p.disabled}>{p.cta}</button>
        </div>
      </div>
    </div>
  );
}

export type TxPhase = "prepare" | "sign" | "send" | "done" | "rejected" | "failed";
export type TxView = { phase: TxPhase; kicker: string; title: string; detail: string; sig?: string; error?: string };

export function TxModal({ tx, onDone, onRetry }: { tx: TxView; onDone: () => void; onRetry: () => void }) {
  const order: TxPhase[] = ["sign", "send", "done"];
  const idx = tx.phase === "prepare" ? 0 : tx.phase === "rejected" ? 0 : tx.phase === "failed" ? -1 : order.indexOf(tx.phase);
  const labels = [tx.phase === "prepare" ? "Simulating transaction" : "Approve in your wallet", "Submitting to Solana", "Confirmed"];
  const failed = tx.phase === "rejected" || tx.phase === "failed";
  return (
    <div className="dialog-backdrop" style={{ zIndex: 60 }}>
      <div className="dialog" style={{ width: "min(420px,100%)", padding: "var(--space-8)", gap: "var(--space-6)" }}>
        <div>
          <div className="card-kicker">{tx.kicker}</div>
          <div className="dialog-title" style={{ marginTop: 4 }}>{tx.title}</div>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{tx.detail}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {labels.map((l, k) => {
            const done = k < idx || tx.phase === "done";
            const active = k === idx && !failed && tx.phase !== "done";
            const fail = tx.phase === "rejected" && k === 0;
            const col = fail ? "var(--color-accent-300)" : done || active ? "var(--color-text)" : "var(--color-neutral-600)";
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: 14, color: col }}>
                {active ? (
                  <Icon n="circle-notch" spin size={20} style={{ color: "var(--color-accent)" }} />
                ) : (
                  <Icon n={fail ? "x-circle" : done ? "check-circle" : "circle"} size={20} />
                )}
                <span>{fail ? "Rejected in wallet" : l}</span>
              </div>
            );
          })}
        </div>
        {tx.phase === "done" && (
          <>
            {tx.sig && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)", background: "var(--color-bg)" }}>
                <span className="text-muted">Signature</span>
                <a href={explorerTx(tx.sig)} target="_blank" rel="noreferrer" className="mono" style={{ textDecoration: "none" }}>
                  {short(tx.sig)} <Icon n="arrow-up-right" />
                </a>
              </div>
            )}
            <div className="dialog-actions" style={{ margin: 0 }}>
              <button className="btn btn-primary" onClick={onDone}>Done</button>
            </div>
          </>
        )}
        {failed && (
          <>
            <div style={{ fontSize: 13, color: "var(--color-accent-300)", overflowWrap: "anywhere" }}>
              {tx.phase === "rejected" ? "The request was rejected in your wallet. Nothing was sent to the network." : tx.error}
            </div>
            <div className="dialog-actions" style={{ margin: 0 }}>
              <button className="btn btn-secondary" onClick={onDone}>Cancel</button>
              <button className="btn btn-primary" onClick={onRetry}>Try again</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
