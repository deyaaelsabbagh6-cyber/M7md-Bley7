import { requireRole } from '@/lib/role'
import { createOwner } from './actions'
import BulkList from '@/app/components/BulkList'
const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 12, marginTop: 8, background: '#14110cb8' }
export default async function Owners() {
  const { sb, user } = await requireRole('owner')
  const { data } = await sb.from('profiles').select('id,full_name,username,is_active,created_at').eq('role', 'owner').order('created_at')
  return (<>
    <h1 style={{ color: '#f3d98b' }}>👑 المالكون</h1>
    <p style={{ opacity: .75 }}>أي مالك جديد يبقى «بانتظار الاعتماد» ولا يستطيع الدخول إلا بعد اعتماد مالك حالي.</p>
    <form action={createOwner} style={{ ...box, display: 'grid', gap: 6, maxWidth: 380 }}>
      <b>إضافة حساب مالك</b>
      <input name="name" required placeholder="الاسم" />
      <input name="username" required placeholder="اسم المستخدم (إنجليزي)" autoCapitalize="none" />
      <input name="password" type="password" required minLength={10} placeholder="كلمة مرور (10+ أحرف)" />
      <button>إرسال للاعتماد</button>
    </form>
    <BulkList entity="owners" ops={['enable', 'disable', 'delete']} rows={(data ?? []).filter((o) => o.id !== user.id).map((o) => ({ id: o.id, ops: o.is_active ? ['disable'] : ['enable', 'delete'], node: (
      <div><b>{o.full_name}</b> (@{o.username}) — {o.is_active ? '✅ معتمد' : '⏳ بانتظار الاعتماد / معطّل'}</div>) }))} empty="لا توجد حسابات أخرى." />
  </>)
}
