import { requireOwner } from '@/lib/owner'

const one = <T,>(x: T | T[] | null | undefined) => (Array.isArray(x) ? x[0] : x)
export default async function Attendance() {
  const { sb } = await requireOwner()
  const { data } = await sb.from('attendance').select('id,check_in,check_out,auto_closed,lawyers(profiles(full_name))').order('check_in', { ascending: false }).limit(200)
  const fmt = (v: string) => new Date(v).toLocaleString('ar-EG')
  return (
    <>
      <section className="hero"><div className="hi">🕘</div><div><h1>الحضور والانصراف</h1><p>إدارة دقيقة لفريق عمل أكثر التزامًا — الوقت المعتمد وقت السيرفر</p></div></section>
      <div className="pn"><h3>سجل الحضور</h3>
        <div className="sc"><table className="tb"><thead><tr><th>اسم المحامي</th><th>وقت الحضور</th><th>وقت الانصراف</th><th>ملاحظة</th></tr></thead><tbody>
          {(data ?? []).map((a: any) => (
            <tr key={a.id}><td>{one(one(a.lawyers)?.profiles)?.full_name}</td><td>{fmt(a.check_in)}</td><td>{a.check_out ? fmt(a.check_out) : <span className="b b1">داخل العمل الآن</span>}</td><td>{a.auto_closed ? 'انصراف تلقائي' : ''}</td></tr>))}
          {!data?.length && <tr><td colSpan={4} style={{ opacity: .6 }}>لا سجلات بعد.</td></tr>}
        </tbody></table></div></div>
    </>
  )
}
