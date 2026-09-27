import type { ReactNode } from "react";
import { PROGRAM_ID } from "../chain";
import { Icon } from "../ui";

export type Page = "how" | "issuers" | "docs";

export const PAGES: { k: Page; label: string }[] = [
  { k: "how", label: "How it works" },
  { k: "issuers", label: "For issuers" },
  { k: "docs", label: "Developer docs" },
];

const Wrap = ({ kicker, title, sub, wide, children }: { kicker: string; title: string; sub: ReactNode; wide?: boolean; children: ReactNode }) => (
  <main style={{ flex: 1, width: "100%", maxWidth: 1080, margin: "0 auto", padding: "calc(var(--space-8)*2) var(--space-8) calc(var(--space-8)*3)", display: "flex", flexDirection: "column", gap: "calc(var(--space-8)*1.5)", boxSizing: "border-box" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: wide ? undefined : 720 }}>
      <div className="card-kicker">{kicker}</div>
      <h1 style={{ margin: 0, textWrap: "balance" }}>{title}</h1>
      <p className="text-muted" style={{ fontSize: 17, margin: 0, textWrap: "pretty" }}>{sub}</p>
    </div>
    {children}
  </main>
);

const Section = ({ title, sub, wide, children }: { title: string; sub?: ReactNode; wide?: boolean; children: ReactNode }) => (
  <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
    <div>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {sub && <p className="text-muted" style={{ margin: "var(--space-2) 0 0", maxWidth: wide ? undefined : 720 }}>{sub}</p>}
    </div>
    {children}
  </section>
);

const Grid = ({ min = 240, children }: { min?: number; children: ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${min}px,1fr))`, gap: "var(--space-6)" }}>{children}</div>
);

const Feature = ({ icon, title, children }: { icon: string; title: string; children: ReactNode }) => (
  <div className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
    <Icon n={icon} size={22} style={{ color: "var(--color-accent)" }} />
    <div className="card-title">{title}</div>
    <p className="card-body">{children}</p>
  </div>
);

const Steps = ({ items }: { items: { title: string; body: ReactNode }[] }) => (
  <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
    {items.map((s, i) => (
      <li key={i} style={{ display: "grid", gridTemplateColumns: "40px minmax(0,1fr)", gap: "var(--space-4)", paddingBottom: i < items.length - 1 ? "var(--space-6)" : 0, position: "relative" }}>
        {i < items.length - 1 && <span style={{ position: "absolute", left: 15, top: 34, bottom: 4, width: 2, background: "linear-gradient(to bottom, var(--color-accent-700), var(--color-neutral-800))" }} />}
        <span style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--color-accent)", display: "grid", placeItems: "center", fontSize: 13, color: "var(--color-accent)", background: "var(--color-bg)" }}>{i + 1}</span>
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontSize: 16, marginBottom: 4 }}>{s.title}</div>
          <div className="text-muted" style={{ fontSize: 14, textWrap: "pretty" }}>{s.body}</div>
        </div>
      </li>
    ))}
  </ol>
);

const HL = /(b?"(?:[^"\\]|\\.)*")|\b(\d+)\b|\b(use|const|pub|fn|let|mut|as|else|return|if|import|export|from|async|await|new|var|func|static|final|class|public|throws|true|false|null|nil)\b|\b([A-Z]\w*|i64|u8|bool|long|byte|boolean|int64|string|error|number)\b|\b(\w+)(?=\()/g;
const HL_COLORS = ["#a5e0a0", "#f5b97a", "var(--color-accent-300)", "#7dd3fc", "#f7e08b"];

function highlight(code: string) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of code.matchAll(HL)) {
    out.push(code.slice(last, m.index));
    out.push(<span key={m.index} style={{ color: HL_COLORS[m.slice(1).findIndex(Boolean)] }}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  out.push(code.slice(last));
  return out;
}

const Code = ({ children }: { children: string }) => (
  <pre className="mono" style={{ flex: 1, margin: 0, padding: "var(--space-4) var(--space-6)", borderRadius: "var(--radius-md)", background: "var(--color-bg)", fontSize: 13, lineHeight: 1.6, overflowX: "auto", overflowY: "hidden" }}>
    {highlight(children)}
  </pre>
);

const Ledger = ({ title, rows, total }: { title: string; rows: [string, string][]; total: [string, string] }) => (
  <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-2)", fontSize: 14 }}>
    <div className="card-kicker" style={{ marginBottom: "var(--space-2)" }}>{title}</div>
    {rows.map(([k, v]) => (
      <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }}>
        <span className="text-muted">{k}</span>
        <span className="mono" style={{ whiteSpace: "nowrap" }}>{v}</span>
      </div>
    ))}
    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", paddingTop: "var(--space-3)", marginTop: "var(--space-1)", borderTop: "1px solid var(--color-divider)", fontSize: 15 }}>
      <span>{total[0]}</span>
      <span style={{ color: "var(--color-accent-300)", textAlign: "right" }}>{total[1]}</span>
    </div>
  </div>
);

const Cta = ({ title, body, children }: { title: string; body: ReactNode; children?: ReactNode }) => (
  <div className="card elev-md" style={{ padding: "var(--space-8)", gap: "var(--space-4)", flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
    <div style={{ flex: 1, minWidth: 260 }}>
      <div className="card-title" style={{ fontSize: 22 }}>{title}</div>
      <p className="card-body" style={{ marginTop: "var(--space-2)" }}>{body}</p>
    </div>
    {children ?? (
      <a href="#" className="btn btn-primary" style={{ textDecoration: "none" }}>
        <Icon n="wallet" />
        Connect a wallet
      </a>
    )}
  </div>
);

export function HowItWorks() {
  return (
    <Wrap
      kicker="How it works"
      title="A license is just a Solana account."
      sub="Horkos keeps every license, its price and its refund terms on-chain. Your wallet is the proof of purchase, and any app can check it with a single account read."
    >
      <Section title="The life of a license">
        <Steps
          items={[
            { title: "Pick a license", body: "Browse license types from active issuers. Each one shows its price, how long it lasts (a set period or indefinite) and its refund window. Some issuers offer no refunds." },
            { title: "Buy with your wallet", body: "One transaction creates a license account tied to your wallet and holds your payment in escrow inside it. The issuer can't touch the money until the refund window closes." },
            { title: "Change your mind", body: "Before the refund window closes you can resign and get the full price back. A new license ends straight away; a renewal falls back to its previous expiry. You only get one resignation per license, and the account rent and network fee aren't refunded." },
            { title: "Issuer gets paid", body: "Once the window closes, the issuer claims the escrow. 0.1% of it goes to the protocol as an operation fee, taken from the issuer's share, not added to your price." },
            { title: "Renew when you want", body: "After the refund window you can renew at the issuer's current price and duration. The new period starts at your current expiry, so you never lose time you already paid for. Each renewal gets its own refund window, unless you've already resigned from this license." },
          ]}
        />
      </Section>

      <Section title="What you pay" sub="Example for a 10 SOL license. Rent is Solana's deposit for storing your license account. The account is never closed, so the rent stays with it.">
        <Grid min={300}>
          <Ledger
            title="Buying"
            rows={[
              ["License price (held in escrow)", "10.000000"],
              ["License account rent (once)", "≈ 0.001629"],
              ["Network fee", "≈ 0.000005"],
            ]}
            total={["Total", "≈ 10.001634 SOL"]}
          />
          <Ledger
            title="Resigning inside the window"
            rows={[
              ["Price refunded", "+ 10.000000"],
              ["Rent", "not refunded"],
              ["Network fee", "− 0.000005"],
            ]}
            total={["You get back", "≈ 9.999995 SOL"]}
          />
        </Grid>
      </Section>

      <Section title="Why on-chain">
        <Grid>
          <Feature icon="arrow-counter-clockwise" title="Refunds are enforced">The program, not the seller, decides refunds. Until the window closes, the money is still yours.</Feature>
          <Feature icon="magnifying-glass" title="Free verification">Checking a license is a read of a public account. No license server, API key or lookup fee.</Feature>
          <Feature icon="lock-simple" title="Terms can't change under you">If the issuer changes the price, duration or refund window, your current period keeps its terms. The new terms apply only when you renew.</Feature>
          <Feature icon="coins" title="Tiny, visible fee">A flat 0.1% on each settled sale or renewal, paid by the issuer and taken on-chain where anyone can audit it.</Feature>
        </Grid>
      </Section>

      <Section title="Who does what">
        <table className="table">
          <thead><tr><th>Role</th><th>Can</th></tr></thead>
          <tbody>
            <tr><td style={{ whiteSpace: "nowrap" }}><Icon n="crown-simple" /> Master</td><td className="text-muted">Sets the issuer fee and revokes issuers. Receives issuer fees and the 0.1% operation fee.</td></tr>
            <tr><td style={{ whiteSpace: "nowrap" }}><Icon n="stack" /> Issuer</td><td className="text-muted">Publish license types, change their terms, pause sales and claim proceeds after refund windows close.</td></tr>
            <tr><td style={{ whiteSpace: "nowrap" }}><Icon n="user" /> Owner</td><td className="text-muted">Buy and renew licenses, and resign once per license for a refund. One license per type per wallet; after resigning you can come back by renewing, not by buying again.</td></tr>
          </tbody>
        </table>
      </Section>

      <Cta title="Ready to try it?" body="Connect a wallet to browse licenses on the current cluster." />
    </Wrap>
  );
}

export function ForIssuers() {
  return (
    <Wrap
      kicker="For issuers"
      title="Sell software licenses without running a license server."
      sub="Publish a license type once. Horkos handles checkout, escrow, refunds and renewals, and your app verifies ownership with a free account read."
    >
      <Grid>
        <Feature icon="storefront" title="Instant storefront">Every active license type shows up in Browse for every connected wallet.</Feature>
        <Feature icon="hand-coins" title="Predictable payouts">Proceeds unlock the moment each buyer's refund window ends. Claim them whenever you like.</Feature>
        <Feature icon="shield-check" title="No chargebacks">Refunds only happen inside the window you set. After that, the sale is final.</Feature>
      </Grid>

      <Section title="Getting started">
        <Steps
          items={[
            { title: "Buy issuer access", body: "Connect your wallet and click Become issuer. You pay a one-time issuer fee, set by the operator of this deployment, plus the account rent." },
            { title: "Create a license type", body: "Set a name, price in SOL, duration (a day, a month, a year, indefinite or custom) and a resignation period in days. You pay a one-time rent deposit for the account." },
            { title: "Ship the check", body: "Derive the buyer's license address in your app and read its expiry. See the developer docs for a copy-paste snippet." },
            { title: "Claim your proceeds", body: "Open Payouts to see what's claimable now and what's still locked in refund windows. Renewals settle the previous payment automatically." },
          ]}
        />
      </Section>

      <Section title="Terms at a glance" sub="Everything below is stored on-chain in your license type account. Changes never touch what a buyer already paid for.">
        <table className="table">
          <thead><tr><th>Setting</th><th>Rules</th><th>Can change</th><th>Effect on licenses already sold</th></tr></thead>
          <tbody>
            <tr><td>Name</td><td className="text-muted">Up to 64 bytes</td><td><span className="tag tag-accent">Anytime</span></td><td className="text-muted">Shown everywhere immediately.</td></tr>
            <tr><td>Description</td><td className="text-muted">Up to 256 bytes</td><td><span className="tag tag-accent">Anytime</span></td><td className="text-muted">Shown everywhere immediately.</td></tr>
            <tr><td>Price</td><td className="text-muted">Any amount of SOL above zero</td><td><span className="tag tag-accent">Anytime</span></td><td className="text-muted">None until the owner renews, then they pay the new price.</td></tr>
            <tr><td>Duration</td><td className="text-muted">A day, 30 days, 90 days, a year or indefinite (1000 years)</td><td><span className="tag tag-accent">Anytime</span></td><td className="text-muted">Current expiry stays. The next renewal adds the new duration.</td></tr>
            <tr><td>Refund window</td><td className="text-muted">0 days (no refunds) up to the full duration</td><td><span className="tag tag-accent">Anytime</span></td><td className="text-muted">Open windows keep their deadline. The next renewal uses the new window.</td></tr>
            <tr><td>Available / Paused</td><td className="text-muted">Paused types are hidden from Browse</td><td><span className="tag tag-accent">Anytime</span></td><td className="text-muted">Licenses keep working until they expire, but can't be renewed while paused. You can still claim payouts.</td></tr>
            <tr><td>Issuer name</td><td className="text-muted">Up to 64 bytes</td><td><span className="tag tag-neutral">Never</span></td><td className="text-muted">Set once when you become an issuer.</td></tr>
          </tbody>
        </table>
      </Section>

      <Section
        title="What a sale pays"
        sub="Example for a 10 SOL license. Rent is Solana's refundable deposit for storing an account; Horkos never closes license accounts, so it stays locked. Network fees are the 0.000005 SOL base fee, plus any priority fee the wallet adds."
      >
        <Grid min={300}>
          <Ledger
            title="Buyer pays"
            rows={[
              ["License price (held in escrow)", "10.000000"],
              ["License account rent", "≈ 0.001629"],
              ["Network fee", "≈ 0.000005"],
            ]}
            total={["Total", "≈ 10.001634 SOL"]}
          />
          <Ledger
            title="You receive when claiming"
            rows={[
              ["Escrow released", "10.000000"],
              ["Operation fee (0.1%)", "− 0.010000"],
              ["Network fee for the claim", "− 0.000005"],
            ]}
            total={["You receive", "≈ 9.989995 SOL"]}
          />
          <Ledger
            title="Your one-time costs"
            rows={[
              ["Issuer fee", "Set by the operator"],
              ["Issuer account rent", "≈ 0.001656"],
              ["Rent per license type", "≈ 0.003689"],
            ]}
            total={["Network fee", "≈ 0.000005 SOL per transaction"]}
          />
        </Grid>
        <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
          When an owner renews, the renewal settles the previous payment to you in the same transaction, so you don't pay the claim fee. A resigned license returns the full price to the buyer, but not the rent.
        </p>
      </Section>

      <Cta title="Already an issuer?" body="Connect your issuer wallet and switch to the Issuer view to publish your first license type." />
    </Wrap>
  );
}

const Lang = ({ name, icon, code }: { name: string; icon: string; code: string }) => (
  <div className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-3)", minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
      <img src={`https://cdn.jsdelivr.net/npm/devicon@2/icons/${icon}.svg`} alt="" width={28} height={28} style={icon.startsWith("rust") ? { filter: "invert(1)" } : undefined} />
      <div className="card-title">{name}</div>
    </div>
    <Code>{code}</Code>
  </div>
);

export function DevDocs() {
  const pid = PROGRAM_ID.toBase58();
  return (
    <Wrap
      kicker="Developer docs"
      title="Verify a license in one RPC call."
      wide
      sub={<>Everything lives in program <span className="mono" style={{ fontSize: 14 }}>{pid}</span>. There's no API to call — derive the address, read the account, compare the expiry.</>}
    >
      <Section title="Check a license" wide sub='The License account is a PDA of ["license", license type, owner wallet]. expires_at is a little-endian i64 Unix timestamp at byte offset 96.'>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <Lang
            name="Rust"
            icon="rust/rust-original"
            code={`use solana_client::rpc_client::RpcClient;
use solana_sdk::{pubkey, pubkey::Pubkey};
use std::time::{SystemTime, UNIX_EPOCH};

const PROGRAM_ID: Pubkey = pubkey!("${pid}");

pub fn has_license(rpc: &RpcClient, license_type: &Pubkey, owner: &Pubkey) -> bool {
    let (pda, _) = Pubkey::find_program_address(
        &[b"license", license_type.as_ref(), owner.as_ref()],
        &PROGRAM_ID,
    );
    let Ok(acc) = rpc.get_account(&pda) else { return false };
    if acc.owner != PROGRAM_ID {
        return false;
    }
    let expires_at = i64::from_le_bytes(acc.data[96..104].try_into().unwrap());
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;
    expires_at > now
}`}
          />
          <Lang
            name="Go"
            icon="go/go-original-wordmark"
            code={`import (
	"context"
	"encoding/binary"
	"errors"
	"time"
	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
)

var programID = solana.MustPublicKeyFromBase58("${pid}")

func HasLicense(ctx context.Context, client *rpc.Client, licenseType, owner solana.PublicKey) (bool, error) {
	pda, _, err := solana.FindProgramAddress(
		[][]byte{[]byte("license"), licenseType.Bytes(), owner.Bytes()}, programID)
	if err != nil {
		return false, err
	}
	res, err := client.GetAccountInfo(ctx, pda)
	if errors.Is(err, rpc.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if !res.Value.Owner.Equals(programID) {
		return false, nil
	}
	expiresAt := int64(binary.LittleEndian.Uint64(res.Value.Data.GetBinary()[96:104]))
	return expiresAt > time.Now().Unix(), nil
}`}
          />
          <Lang
            name="TypeScript"
            icon="typescript/typescript-original"
            code={`import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("${pid}");
const seed = (s: string) => new TextEncoder().encode(s);

export async function hasLicense(conn: Connection, licenseType: PublicKey, owner: PublicKey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [seed("license"), licenseType.toBytes(), owner.toBytes()],
    PROGRAM_ID,
  );
  const acc = await conn.getAccountInfo(pda);
  if (!acc || !acc.owner.equals(PROGRAM_ID)) return false;
  const expiresAt = new DataView(acc.data.buffer, acc.data.byteOffset).getBigInt64(96, true);
  return Number(expiresAt) > Date.now() / 1000;
}`}
          />
          <Lang
            name="Java"
            icon="java/java-original"
            code={`import org.p2p.solanaj.core.PublicKey;
import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.rpc.types.AccountInfo;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Base64;
import java.util.List;

public class Horkos {
    static final PublicKey PROGRAM_ID = new PublicKey("${pid}");

    public static boolean hasLicense(RpcClient client, PublicKey licenseType, PublicKey owner) throws Exception {
        PublicKey pda = PublicKey.findProgramAddress(
            List.of("license".getBytes(), licenseType.toByteArray(), owner.toByteArray()),
            PROGRAM_ID).getAddress();
        AccountInfo acc = client.getApi().getAccountInfo(pda);
        if (acc.getValue() == null || !PROGRAM_ID.toBase58().equals(acc.getValue().getOwner())) return false;
        byte[] data = Base64.getDecoder().decode(acc.getValue().getData().get(0));
        long expiresAt = ByteBuffer.wrap(data, 96, 8).order(ByteOrder.LITTLE_ENDIAN).getLong();
        return expiresAt > System.currentTimeMillis() / 1000;
    }
}`}
          />
        </div>
      </Section>
    </Wrap>
  );
}
