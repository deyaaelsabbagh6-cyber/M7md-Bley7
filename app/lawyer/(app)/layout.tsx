import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/role'
import { logoutWithCheckout } from '../actions'
import { toggleLang } from '@/app/actions'

// لا دخول لأي صفحة عمل قبل تسجيل الحضور
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { sb, user } = await requireRole('lawyer')
  const { data: open } = await sb.from('attendance').select('id').eq('lawyer_id', user.id).is('check_out', null).limit(1)
  if (!open?.length) redirect('/lawyer/checkin')
  const a = { color: '#f3d98b' }
  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#070605', color: '#f4ecd8', paddingBottom: 70 }}>
      <main style={{ padding: 18 }}>{children}</main>
      <nav style={{ position: 'fixed', bottom: 0, inset: 'auto 0 0 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: 12, background: '#000e', borderTop: '1px solid #d4af37' }}>
        <Link href="/lawyer" style={a}>🏠 الرئيسية</Link>
        <Link href="/lawyer/cases" style={a}>📁 القضايا</Link>
        <Link href="/lawyer/clients" style={a}>👤 العملاء</Link>
        <Link href="/scan" style={a}>📷 تصوير</Link>
        <form action={toggleLang}><button style={{ ...a, background: 'none', border: 'none', font: 'inherit' }}>🌐 EN</button></form>
        <form action={logoutWithCheckout}><button style={{ ...a, background: 'none', border: 'none', font: 'inherit' }}>🚪 خروج</button></form>
      </nav>
    </div>
  )
}
