import { useCallback, useState } from "react";

export type TypeMeta = { name: string; desc: string };
type Meta = { types: Record<string, TypeMeta>; issuers: Record<string, string> };

const KEY = "Horkos.meta.v1";

const load = (): Meta => {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? "");
    return { types: m.types ?? {}, issuers: m.issuers ?? {} };
  } catch {
    return { types: {}, issuers: {} };
  }
};

export function useMeta() {
  const [meta, setMeta] = useState<Meta>(load);
  const update = useCallback((f: (m: Meta) => Meta) => {
    setMeta((m) => {
      const next = f(m);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  return {
    typeMeta: (pda: string, id: string): TypeMeta => meta.types[pda] ?? { name: "License type #" + id, desc: "" },
    issuerLabel: (wallet: string) => meta.issuers[wallet],
    setType: (pda: string, t: TypeMeta) => update((m) => ({ ...m, types: { ...m.types, [pda]: t } })),
    setIssuer: (wallet: string, label: string) => update((m) => ({ ...m, issuers: { ...m.issuers, [wallet]: label } })),
  };
}

export type MetaApi = ReturnType<typeof useMeta>;
