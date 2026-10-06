import Link from 'next/link'
import { requireRole } from '@/lib/role'

const one = <T,>(x: T | T[] | null | undefined) => (Array.isArray(x) ? x[0] : x)
const ST: Record<string, [string, string]> = { open: ['قيد المتابعة', 'b1'], pending: ['معلقة', 'b4'], closed: ['مكتملة', 'b3'], archived: ['مؤرشفة', 'b2'] }

export default async function Home() {
  const { sb, user, name } = await requireRole('lawyer')
  const { data: open } = await sb.from('attendance').select('check_in').eq('lawyer_id', user.id).is('check_out', null).maybeSingle()
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const [{ data: cases }, { data: hs }, { data: tasks }, { data: reqs }] = await Promise.all([
    sb.from('cases').select('id,case_number,case_type,status,created_at,clients(full_name)').order('created_at', { ascending: false }).limit(5),
    sb.from('hearings').select('id,hearing_at,court,cases(case_number)').gte('hearing_at', start.toISOString()).order('hearing_at').limit(4),
    sb.from('tasks').select('id,title').eq('lawyer_id', user.id).eq('done', false).limit(6),
    sb.from('assignments').select('id,kind,note,status,cases(case_number)').eq('status', 'new').order('created_at', { ascending: false }).limit(4),
  ])
  const stat = (icon: string, label: string, v: number | string) => <div className="pn st"><div className="ic">{icon}</div><div><small>{label}</small><b>{v}</b></div></div>
  return (
    <>
      <section className="hero"><div className="hi">⚖️</div><div><h1>مرحباً بك أ. {name}</h1><p>مكتب بليح للمحاماة — الحق لا يضيع .. ونحن نحميه</p></div></section>
      <div className="row3" style={{ margin: '12px 0' }}>
        {stat('📄', 'قضاياي', cases?.length ?? 0)}{stat('📅', 'جلسات قادمة', hs?.length ?? 0)}{stat('✅', 'مهامي', tasks?.length ?? 0)}{stat('📨', 'طلبات جديدة', reqs?.length ?? 0)}
      </div>
      <div className="split">
        <div className="mn">
          <div className="pn"><h3>أحدث قضاياي<Link prefetch={false} className="bt sm" href="/lawyer/cases">عرض الكل</Link></h3>
            <div className="sc"><table className="tb"><thead><tr><th>رقم القضية</th><th>النوع</th><th>العميل</th><th>الحالة</th></tr></thead><tbody>
              {(cases ?? []).map((c: any) => { const s = ST[c.status] ?? ST.open; return <tr key={c.id}><td>{c.case_number}</td><td>{c.case_type}</td><td>{one(c.clients)?.full_name}</td><td><span className={`b ${s[1]}`}>{s[0]}</span></td></tr> })}
              {!cases?.length && <tr><td colSpan={4} style={{ opacity: .6 }}>لا توجد قضايا مسندة إليك.</td></tr>}
            </tbody></table></div></div>
          <div className="pn"><h3>جلساتي القادمة</h3>
            {(hs ?? []).map((h: any) => <div className="li" key={h.id}>{new Date(h.hearing_at).toLocaleString('ar-EG')} — {h.court} — {one(h.cases)?.case_number}</div>)}
            {!hs?.length && <p style={{ opacity: .6 }}>لا جلسات قادمة.</p>}</div>
        </div>
        <div className="mn">
          <div className="pn"><h3>الحضور والانصراف</h3><p>{open ? `حاضر منذ ${new Date(open.check_in).toLocaleTimeString('ar-EG')}` : 'لم تسجّل الحضور'}</p>
            <p style={{ opacity: .7, fontSize: 13 }}>يُسجَّل الانصراف تلقائيًا عند الضغط على «خروج».</p></div>
          <div className="pn"><h3>الطلبات الجديدة<Link prefetch={false} className="bt sm" href="/lawyer/requests">عرض الكل</Link></h3>
            {(reqs ?? []).map((r: any) => <div className="li" key={r.id}><div className="ic">📨</div><div><b>{r.kind}</b><small>{one(r.cases)?.case_number} {r.note ?? ''}</small></div></div>)}
            {!reqs?.length && <p style={{ opacity: .6 }}>لا طلبات جديدة.</p>}</div>
          <div className="pn"><h3>مهامي</h3>{(tasks ?? []).map((t) => <div className="li" key={t.id}>⬜ {t.title}</div>)}{!tasks?.length && <p style={{ opacity: .6 }}>لا مهام.</p>}</div>
        </div>
      </div>
    </>
  )
}
