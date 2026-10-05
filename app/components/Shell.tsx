import { Suspense } from 'react'
import { serverClient } from '@/lib/supabase'
import { signOutAction, toggleLang } from '@/app/actions'
import { logoutWithCheckout } from '@/app/lawyer/actions'
import NavLinks from './NavLinks'
import PageNav from './PageNav'
import Flash from './Flash'

// العدّاد في مكوّن مستقل حتى لا يؤخّر ظهور الصفحة
async function Bell({ href }: { href: string }) {
  const sb = await serverClient()
  const { count } = await sb.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false)
  return <a href={href} className="bell">🔔{count ? <i className="dot">{count}</i> : null}</a>
}

export default async function Shell({ role, nav, name, children }: { role: 'owner' | 'lawyer'; nav: [string, string, string][]; name: string; children: React.ReactNode }) {
  const base = role === 'owner' ? '/owner' : '/lawyer'
  return (
    <div className="appwrap">
      <div className="appbg" />
      <div className="shell">
        <aside className="side">
          <div className="logo">⚖️<b>مكتب بليح للمحاماة</b></div>
          <NavLinks items={nav} />
          <div className="who">
            <span className="av">{(name || 'م').trim()[0]}</span>
            <div><b>{name}</b><small>{role === 'owner' ? 'صاحب المكتب' : 'محامي'}</small></div>
            <form action={role === 'owner' ? signOutAction : logoutWithCheckout}><button className="bt sm">خروج</button></form>
          </div>
          <small style={{ opacity: .45, textAlign: 'center' }}>إصدار v12</small>
        </aside>
        <div className="mn">
          <div className="top">
            <form action={`${base}/search`} method="get" style={{ flex: 1, minWidth: 160 }}>
              <input name="q" className="srch" style={{ width: '100%' }} placeholder="ابحث في النظام..." />
            </form>
            <form action={toggleLang}><button className="bt">🌐 العربية / EN</button></form>
            <Suspense fallback={<a href={`${base}/notifications`} className="bell">🔔</a>}><Bell href={`${base}/notifications`} /></Suspense>
          </div>
          <main>
            <Flash />
            {children}
            <PageNav items={nav} />
          </main>
        </div>
      </div>
    </div>
  )
}
