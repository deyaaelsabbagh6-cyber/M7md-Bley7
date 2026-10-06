import Link from 'next/link'
import { requireOwner } from '@/lib/owner'

const ST: Record<string, [string, string]> = { open: ['قيد المتابعة', 'b1'], pending: ['معلقة', 'b4'], closed: ['مكتملة', 'b3'], archived: ['مؤرشفة', 'b2'] }
const one = <T,>(x: T | T[] | null | undefined) => (Array.isArray(x) ? x[0] : x)

export default async function Dashboard() {
  const { sb } = await requireOwner()
  const count = async (t: string, f?: (q: any) => any) => {
    let q = sb.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q)
    return (await q).count ?? 0
  }
  const now = new Date().toISOString()
  const [[clients, openCases, lawyers, docs], [{ data: cases }, { data: hs }, { data: notes }]] = await Promise.all([Promise.all([
    count('clients', (q) => q.eq('archived', false)), count('cases', (q) => q.eq('status', 'open')), count('lawyers'), count('documents', (q) => q.eq('archived', false)),
  ]), Promise.all([
    sb.from('cases').select('id,case_number,case_type,status,created_at,clients(full_name)').order('created_at', { ascending: false }).limit(5),
    sb.from('hearings').select('id,hearing_at,court,cases(case_number)').gte('hearing_at', now).order('hearing_at').limit(4),
    sb.from('notifications').select('id,title,body').order('created_at', { ascending: false }).limit(4),
  ])])
  const stat = (icon: string, label: string, v: number) => (
    <div className="pn st" key={label}><div className="ic">{icon}</div><div><small>{label}</small><b>{v}</b></div></div>
  )
  return (
    <>
      <section className="hero"><div className="hi">⚖️</div><div><h1>مرحباً بك في لوحة التحكم</h1><p>مكتب بليح للمحاماة — الحق لا يضيع .. ونحن نحميه</p></div></section>
      <div className="row3" style={{ margin: '12px 0' }}>
        {stat('📄', 'القضايا النشطة', openCases)}{stat('👥', 'إجمالي العملاء', clients)}{stat('🧑‍💼', 'المحامون', lawyers)}{stat('📑', 'المستندات', docs)}
      </div>
      <div className="split">
        <div className="mn">
          <div className="pn"><h3>أحدث القضايا<Link prefetch={false} className="bt sm" href="/owner/cases">عرض الكل</Link></h3>
            <div className="sc"><table className="tb"><thead><tr><th>رقم القضية</th><th>النوع</th><th>العميل</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
              {(cases ?? []).map((c: any) => { const s = ST[c.status] ?? ST.open; return (
                <tr key={c.id} className="ck"><td><Link prefetch={false} href={`/owner/cases/${c.id}`}>{c.case_number}</Link></td><td>{c.case_type}</td><td>{one(c.clients)?.full_name}</td><td><span className={`b ${s[1]}`}>{s[0]}</span></td><td>{String(c.created_at).slice(0, 10)}</td></tr>) })}
              {!cases?.length && <tr><td colSpan={5} style={{ opacity: .6 }}>لا توجد قضايا بعد.</td></tr>}
            </tbody></table></div></div>
          <div className="pn"><h3>جدول الجلسات القادمة</h3>
            {(hs ?? []).map((h: any) => { const d = new Date(h.hearing_at); return (
              <div className="li" key={h.id}><div className="dt"><small>{d.toLocaleDateString('ar-EG', { month: 'long' })}</small><b>{d.getDate()}</b></div>
                <div>{h.court}<small>{one(h.cases)?.case_number}</small></div><span style={{ marginInlineStart: 'auto' }}>{d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span></div>) })}
            {!hs?.length && <p style={{ opacity: .6 }}>لا جلسات قادمة.</p>}</div>
        </div>
        <div className="mn">
          <div className="pn"><h3>إجراءات سريعة ⚡</h3>
            <Link prefetch={false} className="bt full" href="/owner/lawyers">➕ إضافة محامي</Link><Link prefetch={false} className="bt full" href="/owner/clients">➕ إضافة عميل</Link>
            <Link prefetch={false} className="bt full" href="/owner/cases">⚖️ تسجيل قضية جديدة</Link><Link prefetch={false} className="bt full" href="/owner/documents">📤 رفع مستند</Link><Link prefetch={false} className="bt full" href="/owner/reports">📊 تقرير شامل</Link></div>
          <div className="pn"><h3>الإشعارات الحديثة<Link prefetch={false} className="bt sm" href="/owner/notifications">عرض الكل</Link></h3>
            {(notes ?? []).map((n: any) => <div className="li" key={n.id}><div className="ic">🔔</div><div><b>{n.title}</b>{n.body ? <small>{n.body}</small> : null}</div></div>)}
            {!notes?.length && <p style={{ opacity: .6 }}>لا إشعارات.</p>}</div>
        </div>
      </div>
      <div className="q" style={{ marginTop: 12 }}>“العدل أساس الملك”</div>
    </>
  )
}
