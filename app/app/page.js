'use client'
import { useCallback, useEffect, useState } from 'react'
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { CLUSTER, RPC, PROGRAM_ID, EMPTY, conn, loadState, ix } from '../lib/horkos'

const ROLES = ['master', 'issuer', 'buyer']
const short = (pk) => { const s = pk.toBase58(); return `${s.slice(0, 4)}…${s.slice(-4)}` }
const sol = (l) => `${Number(l) / LAMPORTS_PER_SOL} SOL`
const rel = (t) => { const d = Number(t) - Math.floor(Date.now() / 1000); return d >= 0 ? `in ${d}s` : `${-d}s ago` }

function burner(role) {
  const key = `horkos-burner-${CLUSTER}-${role}`
  let saved = null
  try { saved = localStorage.getItem(key) } catch {}
  const kp = saved ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(saved))) : Keypair.generate()
  try { localStorage.setItem(key, JSON.stringify([...kp.secretKey])) } catch {}
  return { role, publicKey: kp.publicKey, signTransaction: async (tx) => { tx.sign(kp); return tx } }
}

function Table({ head, rows }) {
  return (
    <table border="1" cellPadding="3" style={{ borderCollapse: 'collapse' }}>
      <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  )
}

export default function Page() {
  const [ext, setExt] = useState(null)
  const [burners, setBurners] = useState([])
  const [signer, setSigner] = useState(null)
  const [state, setState] = useState(EMPTY)
  const [balance, setBalance] = useState(null)
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ issuerFee: '1', id: '1', price: '0.1', duration: '60', window: '20' })

  const log = (msg) => setLogs((l) => [`${new Date().toLocaleTimeString()} ${msg}`, ...l])

  useEffect(() => {
    const e = window.phantom?.solana ?? window.solana
    if (e) {
      setExt(e)
      const onChange = (pk) => setSigner(pk ? { publicKey: pk, signTransaction: (tx) => e.signTransaction(tx) } : null)
      e.on?.('accountChanged', onChange)
      return () => e.off?.('accountChanged', onChange)
    }
    if (CLUSTER === 'mainnet-beta') return log('no wallet extension found; burners disabled on mainnet')
    const b = ROLES.map(burner)
    setBurners(b)
    setSigner(b[0])
    log('no wallet extension found, using burner keypairs')
  }, [])

  const refresh = useCallback(async () => {
    setState(await loadState())
    setBalance(signer ? await conn.getBalance(signer.publicKey) : null)
  }, [signer])

  useEffect(() => {
    refresh().catch((e) => log(`✗ refresh: ${e.message}`))
    const t = setInterval(() => refresh().catch(() => {}), 5000)
    return () => clearInterval(t)
  }, [refresh])

  const run = (fn) => async () => {
    try {
      const sig = await fn()
      if (sig) log(`✓ ${sig}`)
    } catch (e) {
      log(`✗ ${e.message}${e.logs ? '\n' + e.logs.join('\n') : ''}`)
    }
    await refresh().catch((e) => log(`✗ refresh: ${e.message}`))
  }
  const Btn = ({ label, fn }) => <button onClick={run(fn)}>{label}</button>
  const field = (k, w = 90) => <input style={{ width: w }} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
  const formVals = () => [BigInt(Math.round(parseFloat(form.price) * LAMPORTS_PER_SOL)), form.duration, form.window]

  const i = ix(signer, state)
  const cfg = state.Config[0]
  const types = new Map(state.LicenseType.map((t) => [t.pubkey.toBase58(), t]))
  const issuers = new Map(state.Issuer.map((x) => [x.pubkey.toBase58(), x]))

  return (
    <>
      <section>
        <div>cluster {CLUSTER} · {RPC} · program {PROGRAM_ID.toBase58()}</div>
        {ext && <button onClick={run(async () => {
          const { publicKey } = await ext.connect()
          setSigner({ publicKey, signTransaction: (tx) => ext.signTransaction(tx) })
        })}>Connect wallet</button>}
        {burners.length > 0 && (
          <select onChange={(e) => setSigner(burners[e.target.value])}>
            {burners.map((b, k) => <option key={k} value={k}>{b.role} (burner) {short(b.publicKey)}</option>)}
          </select>
        )}
        {CLUSTER !== 'mainnet-beta' && <Btn label="Airdrop 1 SOL" fn={async () => {
          if (!signer) throw new Error('connect wallet first')
          await conn.confirmTransaction(await conn.requestAirdrop(signer.publicKey, LAMPORTS_PER_SOL), 'confirmed')
          log('✓ airdrop')
        }} />}
        {' '}{signer ? `${signer.publicKey.toBase58()} · ${balance == null ? '…' : sol(balance)}` : 'not connected'}
      </section>
      <hr />
      <section>
        <b>Master</b> <Btn label="Init config" fn={() => i.initConfig()} />
        {' '}issuer fee SOL {field('issuerFee')} <Btn label="Update config" fn={() => i.updateConfig(BigInt(Math.round(parseFloat(form.issuerFee) * LAMPORTS_PER_SOL)))} />
      </section>
      <hr />
      <section>
        <b>Issuer</b> <Btn label="Become issuer" fn={() => i.purchaseIssuer()} />
        {' '}id {field('id')} price SOL {field('price')} duration s {field('duration')} resign window s {field('window')}
        {' '}<Btn label="Create license type" fn={() => i.createType(form.id, ...formVals())} />
      </section>
      <hr />
      <h3>Config</h3>
      {cfg ? <Table head={['master', 'fee bps', 'issuer fee']} rows={[[short(cfg.master), cfg.fee_bps, sol(cfg.issuer_fee)]]} /> : 'not initialized'}
      <h3>Issuers</h3>
      <Table head={['pda', 'authority', 'active', '']} rows={state.Issuer.map((x) => [
        short(x.pubkey), short(x.authority), String(x.active),
        <Btn label={x.active ? 'Deactivate' : 'Activate'} fn={() => i.updateIssuer(x, !x.active)} />,
      ])} />
      <h3>License types</h3>
      <Table head={['pda', 'issuer', 'id', 'price', 'duration', 'window', 'active', '']} rows={state.LicenseType.map((t) => [
        short(t.pubkey), short(issuers.get(t.issuer.toBase58())?.authority ?? t.issuer), String(t.id), sol(t.price), `${t.duration}s`, `${t.window}s`, String(t.active),
        <>
          <Btn label="Purchase" fn={() => i.purchase(t)} />
          <Btn label="Update from form" fn={() => i.updateType(t, ...formVals(), t.active)} />
          <Btn label={t.active ? 'Deactivate' : 'Activate'} fn={() => i.updateType(t, t.price, t.duration, t.window, !t.active)} />
        </>,
      ])} />
      <h3>Licenses</h3>
      <Table head={['pda', 'owner', 'type', 'escrowed', 'resign until', 'prev expiry', 'expires', 'resigned', '']} rows={state.License.map((l) => {
        const t = types.get(l.license_type.toBase58())
        const x = t && issuers.get(t.issuer.toBase58())
        return [
          short(l.pubkey), short(l.owner), t ? `#${t.id}` : '?', sol(l.paid), rel(l.resign_deadline), rel(l.prev_expires_at), rel(l.expires_at), l.resigned ? 'yes' : 'no',
          t && x && <>
            <Btn label="Renew" fn={() => i.renew(l, t, x.authority)} />
            <Btn label="Resign" fn={() => i.resign(l)} />
            <Btn label="Claim" fn={() => i.claim(l, t)} />
          </>,
        ]
      })} />
      <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', background: '#f4f4f4', padding: 8 }}>{logs.join('\n')}</pre>
    </>
  )
}
