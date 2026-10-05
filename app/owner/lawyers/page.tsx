import { requireOwner } from '@/lib/owner'
import { one } from '@/lib/role'
import DispatchForm from '@/app/components/DispatchForm'
import BulkList from '@/app/components/BulkList'
import { createLawyer, toggleLawyer, resetLawyerPassword, archiveLawyer, sendAssignment } from './actions'

const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 16, marginTop: 10, background: '#14110cb8' }

export default async function Lawyers() {
  const { sb } = await requireOwner()
  const [{ data: list }, { data: cases }] = await Promise.all([
    sb.from('lawyers').select('id,employee_id,specialty,profiles(full_name,phone,is_active,username)').eq('archived', false),
    sb.from('cases').select('id,case_number,case_type').neq('status', 'closed').order('created_at', { ascending: false }),
  ])
  const lawyers = (list ?? []).map((l: any) => ({ id: l.id, name: one(l.profiles)?.full_name ?? '', specialty: l.specialty as string | null }))
  return (
    <>
      <h1 style={{ color: '#f3d98b' }}>المحامون</h1>
      <p><a href="/api/export/lawyers" style={{ color: '#f3d98b' }}>⬇️ تصدير</a></p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <form action={createLawyer} style={{ ...box, display: 'grid', gap: 8, maxWidth: 420, marginTop: 0 }}>
          <b>إضافة محامٍ (المالك فقط)</b>
          <input name="name" required placeholder="الاسم" />
          <input name="username" required placeholder="اسم المستخدم (إنجليزي)" autoCapitalize="none" />
          <input name="phone" placeholder="الهاتف" />
          <input name="emp" placeholder="Employee ID" />
          <input name="specialty" placeholder="التخصص (مثال: مدنية، جنائية، تجارية)" />
          <input name="password" type="password" required minLength={10} placeholder="كلمة مرور (10+ أحرف)" />
          <button>إضافة</button>
        </form>
        <DispatchForm cases={(cases ?? []) as any} lawyers={lawyers} action={sendAssignment} />
      </div>
      <BulkList entity="lawyers" ops={['disable', 'enable', 'delete']} empty="لا يوجد محامون بعد." rows={(list ?? []).map((l: any) => {
        const p = one(l.profiles)
        return { id: l.id, ops: p?.is_active ? ['disable', 'delete'] : ['enable', 'delete'], node: (
          <div>
            <b>{p?.full_name}</b> (@{p?.username}) — {l.specialty ?? 'بدون تخصص'} — {p?.phone} — {l.employee_id} — {p?.is_active ? '✅ مفعّل' : '⛔ معطّل'}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href={`/owner/lawyers/${l.id}`} style={{ color: '#f3d98b' }}>📂 فتح مساحة المحامي / تعديل</a>
              <form action={resetLawyerPassword.bind(null, l.id)}>
                <input name="pw" type="password" minLength={10} required placeholder="كلمة مرور جديدة" /> <button>إعادة تعيين</button>
              </form>
            </div>
          </div>) }
      })} />
    </>
  )
}
