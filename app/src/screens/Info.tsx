import type { ReactNode } from "react";
import { PROGRAM_ID } from "../chain";
import { Icon } from "../ui";

export type Page = "how" | "issuers" | "docs";

export const PAGES: { k: Page; label: string }[] = [
  { k: "how", label: "How it works" },
  { k: "issuers", label: "For issuers" },
  { k: "docs", label: "Developer docs" },
];

const Wrap = ({ kicker, title, sub, children }: { kicker: string; title: string; sub: ReactNode; children: ReactNode }) => (
  <main style={{ flex: 1, width: "100%", maxWidth: 1080, margin: "0 auto", padding: "calc(var(--space-8)*2) var(--space-8) calc(var(--space-8)*3)", display: "flex", flexDirection: "column", gap: "calc(var(--space-8)*1.5)", boxSizing: "border-box" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 720 }}>
      <div className="card-kicker">{kicker}</div>
      <h1 style={{ margin: 0, textWrap: "balance" }}>{title}</h1>
      <p className="text-muted" style={{ fontSize: 17, margin: 0, textWrap: "pretty" }}>{sub}</p>
    </div>
    {children}
  </main>
);

const Section = ({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) => (
  <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
    <div>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {sub && <p className="text-muted" style={{ margin: "var(--space-2) 0 0", maxWidth: 720 }}>{sub}</p>}
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

const Code = ({ children }: { children: string }) => (
  <pre className="mono" style={{ margin: 0, padding: "var(--space-4) var(--space-6)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", fontSize: 13, lineHeight: 1.6, overflowX: "auto" }}>
    {children}
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

const ACCOUNTS: [string, string, string, string][] = [
  ["Config", '["config"]', "master, fee_bps, issuer_fee_lamports, bump", "51"],
  ["Issuer", '["issuer", authority]', "authority, active, bump, name (≤ 64 bytes)", "110"],
  ["LicenseType", '["type", issuer, id as u64 LE]', "issuer, id, price_lamports, duration_secs, resign_window_secs, active, bump, name (≤ 64 bytes), description (≤ 256 bytes)", "402"],
  ["License", '["license", license_type, owner]', "license_type, owner, paid, resign_deadline, prev_expires_at, expires_at, resigned, bump", "106"],
];

const IXS: [string, string, string][] = [
  ["init_config", "anyone (once)", "Creates Config and makes the signer master."],
  ["update_config(issuer_fee_lamports)", "master", "Sets the issuer fee."],
  ["purchase_issuer(name)", "anyone", "Pays the issuer fee to master and creates an active Issuer for the signer. The name can't be changed later."],
  ["update_issuer(active)", "master", "Revokes or restores an issuer."],
  ["create_license_type(id, price, duration, window, name, description)", "issuer", "Publishes a new LicenseType. Requires 0 ≤ window ≤ duration; a window of 0 means no refunds."],
  ["update_license_type(price, duration, window, active, name, description)", "issuer", "Replaces the terms, name and description, or pauses sales. Licenses already sold keep their current period."],
  ["purchase", "owner", "Creates License and escrows the price in it. resign_deadline = now + window, expires_at = now + duration."],
  ["renew", "owner", "Once now ≥ resign_deadline: settles any unclaimed payment (emits FeePaid), escrows the current price and extends from max(expiry, now)."],
  ["resign", "owner", "While now < resign_deadline: refunds the escrow and reverts expires_at to prev_expires_at. Once per license; the account stays on chain."],
  ["claim", "issuer", "Once now ≥ resign_deadline: pays escrow to the issuer minus the fee to master (emits FeePaid)."],
];

const ERRORS: [string, string][] = [
  ["Unauthorized", "Signer is not authorized for this action"],
  ["IssuerInactive", "Issuer is not active"],
  ["ResignWindowOpen", "Resign window is still open"],
  ["ResignWindowClosed", "Resign window has closed"],
  ["NothingToClaim", "No escrow to claim"],
  ["Overflow", "Arithmetic overflow"],
  ["InvalidParams", "Invalid license type parameters"],
  ["LicenseTypeInactive", "License type is not active"],
  ["TextTooLong", "Name or description too long"],
];

export function DevDocs() {
  const pid = PROGRAM_ID.toBase58();
  return (
    <Wrap
      kicker="Developer docs"
      title="Verify a license in one RPC call."
      sub={<>Everything lives in program <span className="mono" style={{ fontSize: 14 }}>{pid}</span>. There's no API to call — derive the address, read the account, compare the expiry.</>}
    >
      <Section title="Check a license" sub="The License account is a PDA of the license type and the owner's wallet. expires_at is an i64 Unix timestamp at byte offset 96. A resigned license reverts it to the previous expiry, so the same check covers refunds. Indefinite licenses simply expire about 1000 years out.">
        <Code>{`import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("${pid}");

export async function hasLicense(conn: Connection, licenseType: PublicKey, owner: PublicKey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("license"), licenseType.toBuffer(), owner.toBuffer()],
    PROGRAM_ID,
  );
  const acc = await conn.getAccountInfo(pda);
  if (!acc || !acc.owner.equals(PROGRAM_ID)) return false;
  const expiresAt = Number(acc.data.readBigInt64LE(96));
  return expiresAt > Date.now() / 1000;
}`}</Code>
        <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
          Using Anchor? Load the IDL and call <span className="mono">program.account.license.fetchNullable(pda)</span> instead of decoding by offset.
        </p>
      </Section>

      <Section title="Find a license type address">
        <Code>{`const [issuer] = PublicKey.findProgramAddressSync(
  [Buffer.from("issuer"), issuerWallet.toBuffer()], PROGRAM_ID);

const id = Buffer.alloc(8);
id.writeBigUInt64LE(BigInt(typeId));
const [licenseType] = PublicKey.findProgramAddressSync(
  [Buffer.from("type"), issuer.toBuffer(), id], PROGRAM_ID);`}</Code>
      </Section>

      <Section title="Accounts">
        <table className="table">
          <thead><tr><th>Account</th><th>Seeds</th><th>Fields</th><th>Size (bytes)</th></tr></thead>
          <tbody>
            {ACCOUNTS.map(([a, s, f, b]) => (
              <tr key={a}><td>{a}</td><td className="mono" style={{ fontSize: 12 }}>{s}</td><td className="text-muted" style={{ fontSize: 13 }}>{f}</td><td className="mono" style={{ fontSize: 12 }}>{b}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Instructions">
        <table className="table">
          <thead><tr><th>Instruction</th><th>Signer</th><th>Effect</th></tr></thead>
          <tbody>
            {IXS.map(([i, s, e]) => (
              <tr key={i}><td className="mono" style={{ fontSize: 12 }}>{i}</td><td style={{ whiteSpace: "nowrap" }}>{s}</td><td className="text-muted" style={{ fontSize: 13 }}>{e}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Events" sub="claim and renew emit FeePaid whenever escrow is settled. It's written to the transaction logs, so you can read exact fees from transaction history without comparing balances. amount is the escrow settled and fee is the part of it paid to master, both in lamports.">
        <Code>{`#[event]
pub struct FeePaid {
    pub license: Pubkey,
    pub license_type: Pubkey,
    pub amount: u64,
    pub fee: u64,
}`}</Code>
        <Code>{`import { EventParser } from "@anchor-lang/core";

const parser = new EventParser(program.programId, program.coder);
for (const e of parser.parseLogs(tx.meta.logMessages ?? [])) {
  if (e.name === "feePaid") console.log(e.data.licenseType.toBase58(), e.data.amount.toString(), e.data.fee.toString());
}`}</Code>
      </Section>

      <Section title="Errors">
        <table className="table">
          <thead><tr><th>Code</th><th>Message</th></tr></thead>
          <tbody>
            {ERRORS.map(([c, m]) => (
              <tr key={c}><td className="mono" style={{ fontSize: 12 }}>{c}</td><td className="text-muted" style={{ fontSize: 13 }}>{m}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Cta title="Want to test against real data?" body="Connect a wallet to buy a license on this cluster, then point the snippet above at it." />
    </Wrap>
  );
}
