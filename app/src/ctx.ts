import type { ReactNode } from "react";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";
import type { ChainState, HorkosProgram, IssuerAcc, LicenseAcc, TypeAcc } from "./chain";
import type { MetaApi } from "./meta";

export type Role = "master" | "issuer" | "buyer";
export type Screen = "setup" | "issuers" | "fees" | "types" | "editor" | "payouts" | "browse" | "mine";

export type TxSpec = {
  kicker: string;
  title: string;
  detail: string;
  ixs: () => Promise<TransactionInstruction[]>;
  after?: () => void;
};

export type Ctx = {
  chain: ChainState;
  now: number;
  me: PublicKey;
  balance: number | null;
  program: HorkosProgram;
  meta: MetaApi;
  myIssuer: IssuerAcc | undefined;
  type: (pda: PublicKey) => TypeAcc | undefined;
  issuerOf: (t: TypeAcc) => IssuerAcc | undefined;
  typeName: (t: TypeAcc | undefined) => string;
  issuerName: (i: IssuerAcc | undefined) => string;
  licensesOf: (t: TypeAcc) => LicenseAcc[];
  openDlg: (d: ReactNode) => void;
  closeDlg: () => void;
  runTx: (spec: TxSpec) => void;
  go: (s: Screen, editing?: string | null) => void;
  editing: string | null;
};
