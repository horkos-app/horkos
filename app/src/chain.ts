import { AnchorProvider, BN, Program } from "@anchor-lang/core";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
  type Finality,
} from "@solana/web3.js";
import idl from "../../target/idl/horkos.json";
import type { Horkos } from "../../target/types/horkos";

const RAW_RPC: string = import.meta.env.VITE_RPC_URL ?? "http://127.0.0.1:8899";
export const RPC_URL = new URL(RAW_RPC, location.origin).href;
export const WS_URL = RAW_RPC.startsWith("/") ? RPC_URL.replace(/^http/, "ws") : undefined;
export const CLUSTER: string =
  import.meta.env.VITE_CLUSTER ??
  (RPC_URL.includes("devnet") ? "devnet" : RPC_URL.includes("mainnet") ? "mainnet-beta" : "localnet");
export const PROGRAM_ID = new PublicKey(idl.address);
export const COMMITMENT: Finality = "confirmed";
export const NETWORK_FEE = 5000;
export const DAY = 86400;

const seed = (s: string) => new TextEncoder().encode(s);
const pda = (seeds: Uint8Array[]) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];

export const configPda = () => pda([seed("config")]);
export const issuerPda = (wallet: PublicKey) => pda([seed("issuer"), wallet.toBytes()]);
export const typePda = (issuer: PublicKey, id: BN) => pda([seed("type"), issuer.toBytes(), Uint8Array.from(id.toArray("le", 8))]);
export const licensePda = (type: PublicKey, owner: PublicKey) => pda([seed("license"), type.toBytes(), owner.toBytes()]);

const readonlyWallet: AnchorWallet = {
  publicKey: PublicKey.default,
  signTransaction: async (t) => t,
  signAllTransactions: async (t) => t,
};

export type HorkosProgram = Program<Horkos>;

export const makeProgram = (connection: Connection, wallet?: AnchorWallet): HorkosProgram =>
  new Program<Horkos>(idl as Horkos, new AnchorProvider(connection, wallet ?? readonlyWallet, { commitment: COMMITMENT }));

export type Cfg = { master: PublicKey; feeBps: number; issuerFee: number };
export type IssuerAcc = { pda: PublicKey; authority: PublicKey; active: boolean };
export type TypeAcc = { pda: PublicKey; issuer: PublicKey; id: BN; price: number; duration: number; resign: number; active: boolean };
export type LicenseAcc = {
  pda: PublicKey;
  type: PublicKey;
  owner: PublicKey;
  paid: number;
  resignDeadline: number;
  prevExpiresAt: number;
  resigned: boolean;
  expiresAt: number;
};
export type Rents = { license: number; type: number; issuer: number };
export type ChainState = { cfg: Cfg | null; issuers: IssuerAcc[]; types: TypeAcc[]; licenses: LicenseAcc[]; rents: Rents };

const n = (v: BN) => v.toNumber();

export async function fetchChain(program: HorkosProgram): Promise<ChainState> {
  const c = program.provider.connection;
  const [cfg, issuers, types, licenses, rl, rt, ri] = await Promise.all([
    program.account.config.fetchNullable(configPda()),
    program.account.issuer.all(),
    program.account.licenseType.all(),
    program.account.license.all(),
    c.getMinimumBalanceForRentExemption(8 + 32 + 32 + 8 + 8 + 8 + 8 + 1),
    c.getMinimumBalanceForRentExemption(8 + 32 + 8 + 8 + 8 + 8 + 1 + 1),
    c.getMinimumBalanceForRentExemption(8 + 32 + 1 + 1),
  ]);
  return {
    cfg: cfg ? { master: cfg.master, feeBps: cfg.feeBps, issuerFee: n(cfg.issuerFeeLamports) } : null,
    issuers: issuers.map(({ publicKey, account: a }) => ({ pda: publicKey, authority: a.authority, active: a.active })),
    types: types
      .map(({ publicKey, account: a }) => ({
        pda: publicKey,
        issuer: a.issuer,
        id: a.id,
        price: n(a.priceLamports),
        duration: n(a.durationSecs),
        resign: n(a.resignWindowSecs),
        active: a.active,
      }))
      .sort((x, y) => x.id.cmp(y.id)),
    licenses: licenses.map(({ publicKey, account: a }) => ({
      pda: publicKey,
      type: a.licenseType,
      owner: a.owner,
      paid: n(a.paid),
      resignDeadline: n(a.resignDeadline),
      prevExpiresAt: n(a.prevExpiresAt),
      resigned: a.resigned,
      expiresAt: n(a.expiresAt),
    })),
    rents: { license: rl, type: rt, issuer: ri },
  };
}

export type FeeEvent = { sig: string; time: number; kind: "Claim" | "Renewal"; types: string[]; fee: number; amount: number };

export async function fetchFeeEvents(connection: Connection, cfg: Cfg): Promise<FeeEvent[]> {
  const sigs = (await connection.getSignaturesForAddress(cfg.master, { limit: 300 }, COMMITMENT)).filter((s) => !s.err);
  const out: FeeEvent[] = [];
  for (let i = 0; i < sigs.length; i += 50) {
    const batch = sigs.slice(i, i + 50);
    const txs = await connection.getTransactions(
      batch.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0, commitment: COMMITMENT },
    );
    txs.forEach((tx, k) => {
      if (!tx?.meta) return;
      const keys = tx.transaction.message.getAccountKeys({ accountKeysFromLookups: tx.meta.loadedAddresses ?? undefined });
      const all = [...Array(keys.length).keys()].map((j) => keys.get(j)!);
      const mi = all.findIndex((key) => key.equals(cfg.master));
      if (mi <= 0) return;
      const fee = tx.meta.postBalances[mi] - tx.meta.preBalances[mi];
      if (fee <= 0) return;
      const logs = tx.meta.logMessages ?? [];
      const kind = logs.includes("Program log: Instruction: Renew") ? "Renewal" : logs.includes("Program log: Instruction: Claim") ? "Claim" : null;
      if (!kind) return;
      const typeIdx = kind === "Renewal" ? 5 : 4;
      const types = new Set<string>();
      tx.transaction.message.compiledInstructions.forEach((ix) => {
        if (all[ix.programIdIndex]?.equals(PROGRAM_ID) && ix.accountKeyIndexes.length > typeIdx) types.add(all[ix.accountKeyIndexes[typeIdx]].toBase58());
      });
      out.push({
        sig: batch[k].signature,
        time: tx.blockTime ?? batch[k].blockTime ?? 0,
        kind,
        types: [...types],
        fee,
        amount: Math.round((fee * 10_000) / cfg.feeBps),
      });
    });
  }
  return out.sort((a, b) => b.time - a.time);
}

export class TxError extends Error {
  constructor(message: string, readonly rejected = false) {
    super(message);
  }
}

const logError = (logs?: string[] | null) =>
  logs?.map((l) => l.match(/Error Message: (.*)$/)?.[1] ?? l.match(/custom program error: (.*)$/)?.[0]).find(Boolean);

export async function sendIxs(
  connection: Connection,
  payer: PublicKey,
  sign: (t: Transaction) => Promise<Transaction>,
  ixs: TransactionInstruction[],
  onSigned: () => void,
): Promise<string> {
  const tx = new Transaction().add(...ixs);
  tx.feePayer = payer;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(COMMITMENT);
  tx.recentBlockhash = blockhash;
  const sim = await connection.simulateTransaction(new VersionedTransaction(tx.compileMessage()), { sigVerify: false, commitment: COMMITMENT });
  if (sim.value.err) throw new TxError(logError(sim.value.logs) ?? "Simulation failed: " + JSON.stringify(sim.value.err));
  let signed: Transaction;
  try {
    signed = await sign(tx);
  } catch (e) {
    throw new TxError(e instanceof Error && e.message ? e.message : "Rejected in wallet", true);
  }
  onSigned();
  const sig = await connection.sendRawTransaction(signed.serialize(), { preflightCommitment: COMMITMENT });
  const res = await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, COMMITMENT);
  if (res.value.err) throw new TxError("Transaction failed: " + JSON.stringify(res.value.err));
  return sig;
}

export const errorMessage = (e: unknown) => {
  if (e instanceof TxError) return e.message;
  const logs = (e as { logs?: string[] })?.logs;
  return logError(logs) ?? (e instanceof Error ? e.message : String(e));
};

export const explorerTx = (sig: string) => explorer("tx/" + sig);
export const explorerAddr = (a: PublicKey | string) => explorer("address/" + a.toString());
const explorer = (path: string) =>
  "https://explorer.solana.com/" +
  path +
  (CLUSTER === "mainnet-beta" ? "" : CLUSTER === "devnet" || CLUSTER === "testnet" ? "?cluster=" + CLUSTER : "?cluster=custom&customUrl=" + encodeURIComponent(RPC_URL));
