import { Buffer } from 'buffer'
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl } from '@solana/web3.js'

export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? 'localnet'
export const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? (CLUSTER === 'localnet' ? 'http://127.0.0.1:8899' : clusterApiUrl(CLUSTER))
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? '4Y55LTgKQPYsy9pTqXYUupeRrogBDG83LwJTmWEkggfh')
export const conn = new Connection(RPC, 'confirmed')
export const EMPTY = { Config: [], Issuer: [], LicenseType: [], License: [] }

const SYS = SystemProgram.programId
const sha8 = async (s) => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))).subarray(0, 8)
const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b }
const i64 = (n) => { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(n)); return b }
const bool = (v) => Buffer.from([v ? 1 : 0])
const seed = (s) => typeof s === 'string' ? Buffer.from(s) : s.toBuffer ? s.toBuffer() : s
const pda = (...seeds) => PublicKey.findProgramAddressSync(seeds.map(seed), PROGRAM_ID)[0]
const acc = (pubkey, isSigner = false, isWritable = false) => ({ pubkey, isSigner, isWritable })
const config = pda('config')

function reader(data) {
  let o = 8
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return {
    pk: () => new PublicKey(data.subarray(o, o += 32)),
    u64: () => { const x = v.getBigUint64(o, true); o += 8; return x },
    i64: () => { const x = v.getBigInt64(o, true); o += 8; return x },
    u16: () => { const x = v.getUint16(o, true); o += 2; return x },
    bool: () => data[o++] === 1,
  }
}

const LAYOUTS = {
  Config: (r) => ({ master: r.pk(), fee_bps: r.u16(), issuer_fee: r.u64() }),
  Issuer: (r) => ({ authority: r.pk(), active: r.bool() }),
  LicenseType: (r) => ({ issuer: r.pk(), id: r.u64(), price: r.u64(), duration: r.i64(), window: r.i64(), active: r.bool() }),
  License: (r) => ({ license_type: r.pk(), owner: r.pk(), paid: r.u64(), resign_deadline: r.i64(), prev_expires_at: r.i64(), expires_at: r.i64(), resigned: r.bool() }),
}

export async function loadState() {
  const discs = Object.fromEntries(await Promise.all(Object.keys(LAYOUTS).map(async (n) => [(await sha8(`account:${n}`)).toString('hex'), n])))
  const s = { Config: [], Issuer: [], LicenseType: [], License: [] }
  for (const { pubkey, account } of await conn.getProgramAccounts(PROGRAM_ID)) {
    const name = discs[Buffer.from(account.data.subarray(0, 8)).toString('hex')]
    if (name) s[name].push({ pubkey, ...LAYOUTS[name](reader(account.data)) })
  }
  return s
}

async function send(signer, name, keys, ...args) {
  if (!signer) throw new Error('connect wallet first')
  const data = Buffer.concat([await sha8(`global:${name}`), ...args])
  const tx = new Transaction().add(new TransactionInstruction({ programId: PROGRAM_ID, keys, data }))
  tx.feePayer = signer.publicKey
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash
  const signed = await signer.signTransaction(tx)
  const sig = await conn.sendRawTransaction(signed.serialize())
  const { value } = await conn.confirmTransaction(sig, 'confirmed')
  if (value.err) throw new Error(`${name} failed: ${JSON.stringify(value.err)}`)
  return sig
}

export function ix(signer, state) {
  const wallet = signer?.publicKey
  const master = () => state.Config[0].master
  return {
    initConfig: () => send(signer, 'init_config', [acc(wallet, true, true), acc(config, false, true), acc(SYS)]),
    updateConfig: (fee) => send(signer, 'update_config', [acc(wallet, true), acc(config, false, true)], u64(fee)),
    purchaseIssuer: () => send(signer, 'purchase_issuer', [acc(wallet, true, true), acc(master(), false, true), acc(config), acc(pda('issuer', wallet), false, true), acc(SYS)]),
    updateIssuer: (i, active) => send(signer, 'update_issuer', [acc(wallet, true), acc(config), acc(i.pubkey, false, true)], bool(active)),
    createType: (id, price, dur, win) => {
      const issuer = pda('issuer', wallet)
      return send(signer, 'create_license_type', [acc(wallet, true, true), acc(issuer), acc(pda('type', issuer, u64(id)), false, true), acc(SYS)], u64(id), u64(price), i64(dur), i64(win))
    },
    updateType: (t, price, dur, win, active) => send(signer, 'update_license_type', [acc(wallet, true), acc(t.issuer), acc(t.pubkey, false, true)], u64(price), i64(dur), i64(win), bool(active)),
    purchase: (t) => send(signer, 'purchase', [acc(wallet, true, true), acc(t.issuer), acc(t.pubkey), acc(pda('license', t.pubkey, wallet), false, true), acc(SYS)]),
    renew: (l, t, authority) => send(signer, 'renew', [acc(wallet, true, true), acc(config), acc(master(), false, true), acc(t.issuer), acc(authority, false, true), acc(t.pubkey), acc(l.pubkey, false, true), acc(SYS)]),
    resign: (l) => send(signer, 'resign', [acc(wallet, true, true), acc(l.license_type), acc(l.pubkey, false, true)]),
    claim: (l, t) => send(signer, 'claim', [acc(wallet, true, true), acc(config), acc(master(), false, true), acc(t.issuer), acc(t.pubkey), acc(l.pubkey, false, true)]),
  }
}
