import Link from 'next/link'
import { requireOwner } from '@/lib/owner'
import { signOutAction, toggleLang } from '../actions'

const links = [
  ['/owner', '📊 الرئيسية'], ['/owner/lawyers', '⚖️ المحامون'], ['/owner/clients', '👤 العملاء'], ['/owner/cases', '📁 القضايا'], ['/owner/payments', '💳 المدفوعات'], ['/owner/receipts', '🧾 الإيصالات'], ['/owner/security', '🔐 الأمان'], ['/owner/expenses', '🧮 المصروفات'], ['/owner/lawyer-finance', '💼 مالية المحامين'], ['/owner/reports', '🖨️ التقارير'],
]
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireOwner()
  return (
    <div dir="rtl" style={{ display: 'flex', minHeight: '100vh', background: '#070605', color: '#f4ecd8', flexWrap: 'wrap' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, borderInlineEnd: '1px solid #d4af3766', minWidth: 180 }}>
        <b style={{ color: '#f3d98b' }}>👑 لوحة المالك</b>
        {links.map(([h, t]) => <Link key={h} href={h} style={{ color: '#f3d98b' }}>{t}</Link>)}
        <form action={toggleLang}><button style={{ background: 'none', border: '1px solid #d4af37', color: '#f3d98b', borderRadius: 8, padding: '4px 10px' }}>🌐 EN / عربي</button></form>
        <form action={signOutAction}><button style={{ background: 'none', border: '1px solid #d4af37', color: '#f3d98b', borderRadius: 8, padding: '4px 10px' }}>🚪 خروج</button></form>
      </nav>
      <main style={{ flex: 1, padding: 20, minWidth: 280 }}>{children}</main>
    </div>
  )
}
