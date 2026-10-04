import { requireRole, one } from '@/lib/role'
import { addTask, setLead } from './actions'
import { updateLawyer, sendAssignment } from '../actions'
import DispatchForm from '@/app/components/DispatchForm'
const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 12, marginTop: 8, background: '#14110cb8' }
// مساحة المحامي كما يراها المالك: كل شيء يخص هذا المحامي فقط
export default async function LawyerSpace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await requireRole('owner')
  const { data: lw } = await sb.from('lawyers').select('employee_id,specialty').eq('id', id).single()
  const [{ data: p }, { data: cases }, { data: att }, { data: tasks }, { data: all }] = await Promise.all([
    sb.from('profiles').select('full_name,phone,username,is_active').eq('id', id).single(),
    sb.from('cases').select('id,case_number,case_type,status,clients(full_name)').eq('lead_lawyer_id', id),
    sb.from('attendance').select('check_in,check_out,auto_closed').eq('lawyer_id', id).order('check_in', { ascending: false }).limit(10),
    sb.from('tasks').select('id,title,done,due_at').eq('lawyer_id', id).order('due_at'),
    sb.from('cases').select('id,case_number,case_type').order('created_at', { ascending: false }),
  ])
  return (<>
    <a href="/owner/lawyers" style={{ color: '#f3d98b' }}>← المحامون</a>
    <h1 style={{ color: '#f3d98b' }}>⚖️ {p?.full_name} <small>(@{p?.username})</small></h1>
    <p>{p?.phone} — {p?.is_active ? '✅ مفعّل' : '⛔ معطّل'}</p>
    <form action={updateLawyer.bind(null, id)} style={{ display: 'grid', gap: 6, maxWidth: 380, margin: '10px 0' }}>
      <b>✏️ تعديل بيانات المحامي</b>
      <input name="name" required defaultValue={p?.full_name} placeholder="الاسم" /><input name="phone" defaultValue={p?.phone ?? ''} placeholder="الهاتف" />
      <input name="emp" defaultValue={lw?.employee_id ?? ''} placeholder="Employee ID" /><input name="specialty" defaultValue={lw?.specialty ?? ''} placeholder="التخصص" /><button>حفظ</button></form>
    <DispatchForm cases={(all ?? []) as any} lawyers={[]} action={sendAssignment} fixedLawyer={id} />
    <h2>القضايا</h2>
    {(cases ?? []).map((c: any) => <div key={c.id} style={box}>#{c.case_number} — {c.case_type} — {c.status} — {one(c.clients)?.full_name}</div>)}
    {!cases?.length && <p style={{ opacity: .6 }}>لا قضايا.</p>}
    <form action={setLead.bind(null, id)} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      <select name="case" required><option value="">إسناد قضية إليه</option>{(all ?? []).map((c) => <option key={c.id} value={c.id}>#{c.case_number}</option>)}</select><button>إسناد</button></form>
    <h2>الحضور (آخر 10)</h2>
    {(att ?? []).map((a, i) => <p key={i}>{new Date(a.check_in).toLocaleString('ar-EG')} ← {a.check_out ? new Date(a.check_out).toLocaleString('ar-EG') + (a.auto_closed ? ' (انصراف تلقائي)' : '') : 'لم ينصرف'}</p>)}
    <h2>المهام</h2>
    {(tasks ?? []).map((t) => <p key={t.id}>{t.done ? '✅' : '⬜'} {t.title}</p>)}
    <form action={addTask.bind(null, id)} style={{ display: 'grid', gap: 6, maxWidth: 360, marginTop: 8 }}>
      <input name="title" required placeholder="مهمة جديدة له" /><input name="due" type="datetime-local" /><button>إضافة مهمة</button></form>
  </>)
}
