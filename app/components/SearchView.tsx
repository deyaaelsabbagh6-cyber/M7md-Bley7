const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 10, marginTop: 6, background: '#14110cb8' }
// بحث موحد: النتائج تأتي عبر RLS فيرى كل مستخدم ما يخصه فقط
export default async function SearchView({ sb, q, base, withLawyers }: { sb: any; q: string; base: '/owner' | '/lawyer'; withLawyers?: boolean }) {
  const s = q.replace(/[%,()]/g, '').trim()
  const [cl, cs, lw] = s ? await Promise.all([
    sb.from('clients').select('id,full_name,phone').or(`full_name.ilike.%${s}%,phone.ilike.%${s}%`).limit(20),
    sb.from('cases').select('id,case_number,case_type,court').or(`case_number.ilike.%${s}%,case_type.ilike.%${s}%,court.ilike.%${s}%`).limit(20),
    withLawyers ? sb.from('profiles').select('id,full_name,username').eq('role', 'lawyer').or(`full_name.ilike.%${s}%,username.ilike.%${s}%`).limit(20) : Promise.resolve({ data: [] }),
  ]) : [{ data: [] }, { data: [] }, { data: [] }]
  const none = !cl.data?.length && !cs.data?.length && !lw.data?.length
  return (<>
    <h1 style={{ color: '#f3d98b' }}>🔍 نتائج البحث: {s || '—'}</h1>
    {s && none && <p style={{ opacity: .7 }}>لا توجد نتائج.</p>}
    {!!lw.data?.length && <><h2>المحامون</h2>{lw.data.map((x: any) => <div key={x.id} style={box}><a href={`/owner/lawyers/${x.id}`} style={{ color: '#f3d98b' }}>{x.full_name}</a> (@{x.username})</div>)}</>}
    {!!cl.data?.length && <><h2>العملاء</h2>{cl.data.map((x: any) => <div key={x.id} style={box}><a href={`${base}/clients/${x.id}`} style={{ color: '#f3d98b' }}>{x.full_name}</a> — {x.phone}</div>)}</>}
    {!!cs.data?.length && <><h2>القضايا</h2>{cs.data.map((x: any) => <div key={x.id} style={box}><a href={`${base}/cases/${x.id}`} style={{ color: '#f3d98b' }}>#{x.case_number}</a> — {x.case_type} — {x.court}</div>)}</>}
  </>)
}
