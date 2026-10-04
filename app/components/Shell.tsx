import { serverClient } from '@/lib/supabase'
import { signOutAction, toggleLang } from '@/app/actions'
import { logoutWithCheckout } from '@/app/lawyer/actions'
import NavLinks from './NavLinks'

// هيكل اللوحات: قائمة جانبية + شريط علوي + خلفية التمثال (مطابق للتصميمات)
export default async function Shell({ role, nav, name, children }: { role: 'owner' | 'lawyer'; nav: [string, string, string][]; name: string; children: React.ReactNode }) {
  const sb = await serverClient()
  const { count } = await sb.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false)
  const unread = count ?? 0
  const base = role === 'owner' ? '/owner' : '/lawyer'
  return (
    <div className="appwrap">
      <div className="appbg" />
      <div className="shell">
        <aside className="side">
          <div className="logo">⚖️<b>مكتب بليح للمحاماة</b></div>
          <NavLinks items={nav} badge={{ [`${base}/notifications`]: unread }} />
          <div className="who">
            <span className="av">{(name || 'م').trim()[0]}</span>
            <div><b>{name}</b><small>{role === 'owner' ? 'صاحب المكتب' : 'محامي'}</small></div>
            <form action={role === 'owner' ? signOutAction : logoutWithCheckout}><button className="bt sm">خروج</button></form>
          </div>
        </aside>
        <div className="mn">
          <div className="top">
            <form action={`${base}/search`} method="get" style={{ flex: 1, minWidth: 160 }}>
              <input name="q" className="srch" style={{ width: '100%' }} placeholder="ابحث في النظام..." />
            </form>
            <form action={toggleLang}><button className="bt">🌐 العربية / EN</button></form>
            <a href={`${base}/notifications`} className="bell">🔔{unread ? <i className="dot">{unread}</i> : null}</a>
          </div>
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
