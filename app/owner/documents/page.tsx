import { requireOwner } from '@/lib/owner'

const one = <T,>(x: T | T[] | null | undefined) => (Array.isArray(x) ? x[0] : x)
export default async function Docs({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const { sb } = await requireOwner()
  let query = sb.from('documents').select('id,name,mime,size,created_at,cases(case_number),clients(full_name)').eq('archived', false).order('created_at', { ascending: false }).limit(100)
  if (q) query = query.ilike('name', `%${q.replace(/[%,()]/g, '')}%`)
  const { data } = await query
  return (
    <>
      <section className="hero"><div className="hi">📁</div><div><h1>مركز المستندات</h1><p>تنظيم .. أمان .. وصول أسرع — الرفع يتم من صفحة كل عميل أو قضية</p></div></section>
      <div className="pn"><form className="fl"><input name="q" defaultValue={q} placeholder="ابحث باسم المستند..." /><button className="bp">🔍 بحث</button></form></div>
      <div className="pn"><h3>أحدث المستندات</h3>
        <div className="sc"><table className="tb"><thead><tr><th>اسم المستند</th><th>العميل</th><th>القضية</th><th>الحجم</th><th>تاريخ الرفع</th><th>إجراءات</th></tr></thead><tbody>
          {(data ?? []).map((d: any) => (
            <tr key={d.id}><td>{d.name}</td><td>{one(d.clients)?.full_name ?? '—'}</td><td>{one(d.cases)?.case_number ?? '—'}</td><td>{d.size ? (d.size / 1048576).toFixed(2) + ' MB' : ''}</td><td>{String(d.created_at).slice(0, 10)}</td>
              <td><a className="bt sm" href={`/api/doc/${d.id}`} target="_blank" rel="noopener">👁 عرض</a></td></tr>))}
          {!data?.length && <tr><td colSpan={6} style={{ opacity: .6 }}>لا توجد مستندات.</td></tr>}
        </tbody></table></div></div>
    </>
  )
}
