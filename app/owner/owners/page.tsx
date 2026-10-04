import { requireRole } from '@/lib/role'
import { createOwner, approveOwner, disableOwner } from './actions'
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
      <input name="password" type="password" required minLength={12} placeholder="كلمة مرور (12+ حرفًا)" />
      <button>إرسال للاعتماد</button>
    </form>
    {(data ?? []).map((o) => (
      <div key={o.id} style={box}>
        <b>{o.full_name}</b> (@{o.username}) — {o.is_active ? '✅ معتمد' : '⏳ بانتظار الاعتماد'}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {!o.is_active && <form action={approveOwner.bind(null, o.id)}><button>اعتماد</button></form>}
          {o.is_active && o.id !== user.id && <form action={disableOwner.bind(null, o.id)}><button>تعطيل</button></form>}
        </div>
      </div>
    ))}
  </>)
}
