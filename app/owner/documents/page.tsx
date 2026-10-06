import { requireOwner } from '@/lib/owner'
import BulkList from '@/app/components/BulkList'

const one = <T,>(x: T | T[] | null | undefined) => (Array.isArray(x) ? x[0] : x)
export default async function Docs({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  const { q, show } = await searchParams
  const arch = show === 'archived'
  const { sb } = await requireOwner()
  let query = sb.from('documents').select('id,name,mime,size,created_at,cases(case_number),clients(full_name)').eq('archived', arch).order('created_at', { ascending: false }).limit(100)
  if (q) query = query.ilike('name', `%${q.replace(/[%,()]/g, '')}%`)
  const { data } = await query
  return (
    <>
      <section className="hero"><div className="hi">📁</div><div><h1>مركز المستندات</h1><p>تنظيم .. أمان .. وصول أسرع — الرفع يتم من صفحة كل عميل أو قضية</p></div></section>
      <div className="pn"><form className="fl"><input name="q" defaultValue={q} placeholder="ابحث باسم المستند..." /><button className="bp">🔍 بحث</button></form></div>
      <div className="pn"><h3>أحدث المستندات</h3>
        <p><a href={arch ? '/owner/documents' : '/owner/documents?show=archived'}>{arch ? '← المستندات النشطة' : '🗄 المستندات المعطّلة'}</a></p>
        <BulkList entity="documents" ops={arch ? ['restore', 'delete'] : ['disable', 'delete']} empty="لا توجد مستندات." rows={(data ?? []).map((d: any) => ({ id: d.id, edit: [{ name: 'name', label: 'اسم المستند', value: d.name ?? '' }], node: (
          <div>📄 <a href={`/api/doc/${d.id}`} target="_blank" rel="noopener">{d.name}</a> — {one(d.clients)?.full_name ?? '—'} — {one(d.cases)?.case_number ?? '—'} — {d.size ? (d.size / 1048576).toFixed(2) + ' MB' : ''} — {String(d.created_at).slice(0, 10)}</div>) }))} />
      </div>
    </>
  )
}
