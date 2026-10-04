import { requireRole } from '@/lib/role'
import { endSessions } from './actions'
export default async function Security() {
  const { sb } = await requireRole('owner')
  const [{ data: users }, { data: ev }, { data: au }] = await Promise.all([
    sb.from('profiles').select('id,full_name,username,role,is_active,force_logout_at').in('role', ['owner', 'lawyer']).order('role'),
    sb.from('security_events').select('*').order('created_at', { ascending: false }).limit(50),
    sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
  ])
  const row = { borderBottom: '1px solid #d4af3733', padding: 6, fontSize: 13 }
  return (
    <>
      <h1 style={{ color: '#f3d98b' }}>🔐 مركز الأمان</h1>
      <h2>الجلسات والمستخدمون</h2>
      {(users ?? []).map((u: any) => <div key={u.id} style={row}>{u.role === 'owner' ? '👑' : '⚖️'} {u.full_name} (@{u.username}) — {u.is_active ? 'مفعّل' : 'معطّل'}
        <form action={endSessions.bind(null, u.id)} style={{ display: 'inline', marginInlineStart: 10 }}><button>إنهاء جلساته</button></form></div>)}
      <h2>الأحداث الأمنية</h2>
      {(ev ?? []).map((e) => <div key={e.id} style={row}>{new Date(e.created_at).toLocaleString('ar-EG')} — <b>{e.event}</b> — {e.ip}</div>)}
      <h2>سجل التدقيق</h2>
      {(au ?? []).map((a) => <div key={a.id} style={row}>{new Date(a.created_at).toLocaleString('ar-EG')} — <b>{a.action}</b> — {a.entity} {a.entity_id}</div>)}
    </>
  )
}
