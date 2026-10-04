import { requireRole } from '@/lib/role'

export default async function Home() {
  const { sb, user, name } = await requireRole('lawyer')
  const { data: open } = await sb.from('attendance').select('check_in').eq('lawyer_id', user.id).is('check_out', null).maybeSingle()
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const { data: hs } = await sb.from('hearings').select('id,hearing_at,court,cases(case_number)').gte('hearing_at', start.toISOString()).lt('hearing_at', new Date(+start + 864e5).toISOString())
  const { data: tasks } = await sb.from('tasks').select('id,title,due_at').eq('lawyer_id', user.id).eq('done', false).limit(10)
  const { data: notes } = await sb.from('notifications').select('id,title').eq('read', false).limit(5)
  return (
    <>
      <h1 style={{ color: '#f3d98b' }}>أهلاً {name}</h1>
      <div style={{ border: '1px solid #d4af37', borderRadius: 14, padding: 16, margin: '12px 0', boxShadow: '0 0 20px #d4af3755' }}>
        <b>الحضور والانصراف</b>
        <p style={{ opacity: .8 }}>{open ? `حاضر منذ ${new Date(open.check_in).toLocaleTimeString('ar-EG')}` : 'لم تسجّل الحضور'}</p>
        <p style={{ opacity: .7, fontSize: 13 }}>يُسجَّل الانصراف تلقائيًا عند الخروج من الموقع (زر 🚪 خروج بالأسفل).</p>
      </div>
      <h2>جلسات اليوم</h2>
      {(hs ?? []).map((h: any) => <p key={h.id}>{new Date(h.hearing_at).toLocaleTimeString('ar-EG')} — {h.court} — {(Array.isArray(h.cases) ? h.cases[0] : h.cases)?.case_number}</p>)}
      {!hs?.length && <p style={{ opacity: .6 }}>لا جلسات اليوم.</p>}
      <h2>المهام</h2>
      {(tasks ?? []).map((t) => <p key={t.id}>• {t.title}</p>)}
      {!!notes?.length && <><h2>🔔 إشعارات</h2>{notes.map((n) => <p key={n.id}>{n.title}</p>)}</>}
    </>
  )
}
