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
            { title: "Pick a license", body: "Browse license types published by approved issuers. Each shows its price, how long it lasts and how long you have to change your mind." },
            { title: "Buy with your wallet", body: "One transaction creates a license account tied to your wallet. The payment is held in escrow inside that account — the issuer can't touch it yet." },
            { title: "Change your mind for free", body: "Until the refund window closes you can resign and get every lamport of the price back. A first purchase is closed entirely, so the account rent comes back too." },
            { title: "Issuer gets paid", body: "Once the window closes the issuer claims the escrow. 0.1% goes to the protocol as an operation fee; the rest goes to the issuer." },
            { title: "Renew when you want", body: "Renewing extends the license from its current expiry, so you never lose time you already paid for. Each renewal opens a new refund window for that payment." },
          ]}
        />
      </Section>

      <Section title="Why on-chain">
        <Grid>
          <Feature icon="arrow-counter-clockwise" title="Refunds are guaranteed">The program, not the seller, decides refunds. Inside the window the money is still yours.</Feature>
          <Feature icon="magnifying-glass" title="Free verification">Checking a license is a read of a public account. No license server, API key or lookup fee.</Feature>
          <Feature icon="lock-simple" title="Terms can't change under you">Price changes apply to new sales only. What you bought keeps the terms it was sold with.</Feature>
          <Feature icon="coins" title="Tiny, visible fee">A flat 0.1% on each settled sale or renewal, taken on-chain where anyone can audit it.</Feature>
        </Grid>
      </Section>

      <Section title="Who does what">
        <table className="table">
          <thead><tr><th>Role</th><th>Can</th></tr></thead>
          <tbody>
            <tr><td style={{ whiteSpace: "nowrap" }}><Icon n="crown-simple" /> Master</td><td className="text-muted">Grant and revoke issuers. Receives the 0.1% operation fee.</td></tr>
            <tr><td style={{ whiteSpace: "nowrap" }}><Icon n="stack" /> Issuer</td><td className="text-muted">Publish license types, change prices, pause sales and claim proceeds after refund windows close.</td></tr>
            <tr><td style={{ whiteSpace: "nowrap" }}><Icon n="user" /> Owner</td><td className="text-muted">Buy, renew and resign licenses. One license per type per wallet.</td></tr>
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
            { title: "Get approved", body: "The master account grants issuer rights to your wallet. Ask the operator of this deployment and share your public key." },
            { title: "Create a license type", body: "Set a name, price in SOL, duration (a day, a month, a year or custom) and a resignation period in days. You pay a one-time rent deposit for the account." },
            { title: "Ship the check", body: "Derive the buyer's license address in your app and read its expiry. See the developer docs for a copy-paste snippet." },
            { title: "Claim your proceeds", body: "Open Payouts to see what's claimable now and what's still locked in refund windows. Renewals settle the previous payment automatically." },
          ]}
        />
      </Section>

      <Section title="Terms at a glance">
        <table className="table">
          <thead><tr><th>Setting</th><th>Editable after creation</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>Price</td><td><span className="tag tag-accent">Yes</span></td><td className="text-muted">Applies to new purchases and renewals only.</td></tr>
            <tr><td>On sale</td><td><span className="tag tag-accent">Yes</span></td><td className="text-muted">Pausing blocks new purchases and renewals. Existing licenses keep working.</td></tr>
            <tr><td>Name &amp; description</td><td><span className="tag tag-neutral">Off-chain</span></td><td className="text-muted">Stored in the app, not in the program.</td></tr>
            <tr><td>Duration &amp; refund window</td><td><span className="tag tag-neutral">Fixed</span></td><td className="text-muted">Locked in the app once a type exists, so buyers see stable terms.</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="What a sale pays">
        <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-2)", fontSize: 14, maxWidth: 480 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Buyer pays</span><span>10.00 SOL</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Operation fee (0.1%)</span><span>− 0.01 SOL</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "var(--space-3)", marginTop: "var(--space-1)", borderTop: "1px solid var(--color-divider)", fontSize: 16 }}>
            <span>You receive</span><span style={{ color: "var(--color-accent-300)" }}>9.99 SOL</span>
          </div>
        </div>
      </Section>

      <Cta title="Already approved?" body="Connect your issuer wallet and switch to the Issuer view to publish your first license type." />
    </Wrap>
  );
}

const ACCOUNTS: [string, string, string][] = [
  ["Config", '["config"]', "master, fee_bps"],
  ["Issuer", '["issuer", authority]', "authority, active"],
  ["LicenseType", '["type", issuer, id as u64 LE]', "issuer, id, price_lamports, duration_secs, resign_window_secs, active"],
  ["License", '["license", license_type, owner]', "license_type, owner, paid, resign_deadline, prev_expires_at, expires_at"],
];

const IXS: [string, string, string][] = [
  ["init_config", "anyone (once)", "Creates Config and makes the signer master."],
  ["grant_issuer(wallet)", "master", "Creates an active Issuer for wallet."],
  ["update_issuer(active)", "master", "Revokes or restores an issuer."],
  ["create_license_type(id, price, duration, window)", "issuer", "Publishes a new LicenseType."],
  ["update_license_type(price, duration, window, active)", "issuer", "Changes price or pauses sales."],
  ["purchase", "owner", "Creates License and escrows the price in it."],
  ["renew", "owner", "After the window: settles the previous payment, escrows a new one and extends from max(expiry, now)."],
  ["resign", "owner", "Inside the window: refunds the escrow. Closes the account if it was the first period."],
  ["claim", "issuer", "After the window: pays escrow to the issuer minus the fee to master."],
];

const ERRORS: [string, string][] = [
  ["Unauthorized", "Signer is not authorized for this action"],
  ["IssuerInactive", "Issuer is not active"],
  ["ResignWindowOpen", "Resign window is still open"],
  ["ResignWindowClosed", "Resign window has closed"],
  ["NothingToClaim", "No escrow to claim"],
  ["InvalidParams", "Invalid license type parameters"],
  ["LicenseTypeInactive", "License type is not active"],
];

export function DevDocs() {
  const pid = PROGRAM_ID.toBase58();
  return (
    <Wrap
      kicker="Developer docs"
      title="Verify a license in one RPC call."
      sub={<>Everything lives in program <span className="mono" style={{ fontSize: 14 }}>{pid}</span>. There's no API to call — derive the address, read the account, compare the expiry.</>}
    >
      <Section title="Check a license" sub="The License account is a PDA of the license type and the owner's wallet. expires_at is an i64 Unix timestamp at byte offset 96.">
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
          <thead><tr><th>Account</th><th>Seeds</th><th>Fields</th></tr></thead>
          <tbody>
            {ACCOUNTS.map(([a, s, f]) => (
              <tr key={a}><td>{a}</td><td className="mono" style={{ fontSize: 12 }}>{s}</td><td className="text-muted" style={{ fontSize: 13 }}>{f}</td></tr>
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
