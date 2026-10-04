import { requireOwner } from '@/lib/owner'

const card = { border: '1px solid #d4af3788', borderRadius: 14, padding: 18, boxShadow: '0 0 18px #d4af3733', background: '#14110cb8' }

export default async function Dashboard() {
  const { sb } = await requireOwner()
  const today = new Date().toISOString().slice(0, 10)
  const count = async (t: string, f?: (q: any) => any) => {
    let q = sb.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q)
    return (await q).count ?? 0
  }
  const [clients, openCases, lawyers] = await Promise.all([
    count('clients', (q) => q.eq('archived', false)),
    count('cases', (q) => q.eq('status', 'open')),
    count('lawyers'),
  ])
  const stats = [['العملاء', clients], ['القضايا المفتوحة', openCases], ['المحامون', lawyers]]
  return (
    <>
      <h1 style={{ color: '#f3d98b' }}>نظرة عامة — {today}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, margin: '16px 0' }}>
        {stats.map(([l, n]) => <div key={l as string} style={card}><div style={{ opacity: .7 }}>{l}</div><div style={{ fontSize: 32, color: '#f3d98b' }}>{n}</div></div>)}
      </div>
    </>
  )
}
