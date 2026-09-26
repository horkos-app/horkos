import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { DAY } from "./chain";

export const sol = (lamports: number) =>
  (lamports / LAMPORTS_PER_SOL).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 });

export const short = (k: PublicKey | string) => {
  const s = k.toString();
  return s.slice(0, 4) + "…" + s.slice(-4);
};

export const INDEFINITE = 365_000 * DAY;
export const isIndefinite = (unix: number) => unix - Date.now() / 1000 > INDEFINITE / 2;

export const dt = (unix: number, year = true) =>
  isIndefinite(unix)
    ? "Indefinite"
    : new Date(unix * 1000).toLocaleDateString(
        "en-US",
        year ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" },
      );

const plural = (v: number, unit: string) => {
  const r = Math.round(v * 10) / 10;
  return r + " " + unit + (r === 1 ? "" : "s");
};

export const span = (secs: number) => {
  const s = Math.max(secs, 0);
  if (s >= DAY) return plural(s / DAY, "day");
  if (s >= 3600) return plural(s / 3600, "hour");
  if (s >= 60) return plural(Math.ceil(s / 60), "minute");
  return plural(Math.ceil(s), "second");
};

export const period = (secs: number) =>
  secs >= INDEFINITE ? "indefinite" : secs === 365 * DAY ? "1 year" : secs === 30 * DAY ? "month" : secs === DAY ? "day" : span(secs);

export const initials = (label: string) =>
  label
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
