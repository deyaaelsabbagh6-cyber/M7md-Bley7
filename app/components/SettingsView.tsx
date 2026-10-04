import { toggleLang } from '../actions'
import { changePassword } from '../settings-actions'
export default function SettingsView({ username, name, role, ok }: { username: string; name: string; role: string; ok?: boolean }) {
  const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 14, marginTop: 10, background: '#14110cb8', maxWidth: 400 }
  return (<>
    <h1 style={{ color: '#f3d98b' }}>⚙️ الإعدادات</h1>
    {ok && <p style={{ color: '#7be0a0' }}>✅ تم تغيير كلمة المرور</p>}
    <div style={box}><b>ملفي الشخصي</b><p>{name} — @{username} — {role === 'owner' ? 'مالك' : 'محامي'}</p></div>
    <form action={changePassword} style={{ ...box, display: 'grid', gap: 6 }}>
      <b>🔑 تغيير كلمة المرور</b>
      <input name="cur" type="password" required placeholder="كلمة المرور الحالية" autoComplete="current-password" />
      <input name="next" type="password" required minLength={role === 'owner' ? 12 : 10} placeholder="كلمة المرور الجديدة" autoComplete="new-password" />
      <button>حفظ</button>
    </form>
    <form action={toggleLang} style={box}><b>اللغة / Language</b><br /><button>العربية ⇄ English</button></form>
  </>)
}
