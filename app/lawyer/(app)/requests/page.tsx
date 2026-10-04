import { requireRole, one } from '@/lib/role'
import { setStatus } from './actions'
const KIND: Record<string, string> = { new_case: 'قضية جديدة', investigation: 'طلب تحريات', memo: 'طلب مذكرة', hearing: 'حضور جلسة', other: 'طلب آخر' }
const ST: Record<string, string> = { new: '🆕 جديد', accepted: '👍 تم الاستلام', done: '✅ تم التنفيذ' }
export default async function Requests() {
  const { sb } = await requireRole('lawyer') // RLS: طلباته فقط
  const { data } = await sb.from('assignments').select('id,kind,note,status,created_at,cases(id,case_number,case_type)').order('created_at', { ascending: false })
  return (<>
    <h1 style={{ color: '#f3d98b' }}>📥 الطلبات الواردة</h1>
    {(data ?? []).map((a: any) => { const c = one(a.cases); return (
      <div key={a.id} style={{ border: '1px solid #d4af3788', borderRadius: 14, padding: 14, marginTop: 10, background: '#14110cb8' }}>
        <b>{KIND[a.kind]}</b> — <a href={`/lawyer/cases/${c?.id}`} style={{ color: '#f3d98b' }}>قضية #{c?.case_number}</a> ({c?.case_type}) — {ST[a.status]}
        {a.note && <p style={{ margin: '6px 0' }}>{a.note}</p>}
        <small style={{ opacity: .6 }}>{new Date(a.created_at).toLocaleString('ar-EG')}</small>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {a.status === 'new' && <form action={setStatus.bind(null, a.id, 'accepted')}><button>👍 استلمت</button></form>}
          {a.status !== 'done' && <form action={setStatus.bind(null, a.id, 'done')}><button>✅ تم التنفيذ</button></form>}
        </div>
      </div>) })}
    {!data?.length && <p style={{ opacity: .6 }}>لا توجد طلبات.</p>}
  </>)
}
