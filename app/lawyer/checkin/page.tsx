import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/role'
import { checkInAndGo, logoutWithCheckout } from '../actions'

// بوابة الحضور: أول ما يدخل المحامي لازم يسجّل حضوره
export default async function Gate() {
  const { sb, user, name } = await requireRole('lawyer')
  const { data: open } = await sb.from('attendance').select('id').eq('lawyer_id', user.id).is('check_out', null).limit(1)
  if (open?.length) redirect('/lawyer')
  return (
    <main dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070605', color: '#f4ecd8', textAlign: 'center', padding: 20 }}>
      <div style={{ border: '1px solid #d4af37', borderRadius: 16, padding: 28, boxShadow: '0 0 30px #d4af3755', maxWidth: 380 }}>
        <div style={{ fontSize: 64 }}>🕘</div>
        <h1 style={{ color: '#f3d98b' }}>أهلًا {name}</h1>
        <p>سجّل حضورك أولًا للدخول إلى ملفك.</p>
        <form action={checkInAndGo}><button style={{ padding: '12px 28px', borderRadius: 12, border: '1px solid #f3d98b', background: 'linear-gradient(#f0d27a,#b8902a)', color: '#1a1405', fontWeight: 700, fontSize: 17 }}>👆 تسجيل الحضور</button></form>
        <form action={logoutWithCheckout} style={{ marginTop: 14 }}><button style={{ background: 'none', border: 'none', color: '#f3d98b' }}>خروج</button></form>
      </div>
    </main>
  )
}
