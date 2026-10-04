'use client'
import { useEffect, useRef, useState } from 'react'
import { toggleLang } from '../actions'

const ROLES = [
  { key: 'owner', label: '👑 المالك' },
  { key: 'lawyer', label: '⚖️ المحامي' },
] as const

export default function Login() {
  const [role, setRole] = useState<string>('owner')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const dest = useRef('/')
  const go = () => { if (dest.current) { const d = dest.current; dest.current = ''; location.href = d } }
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.get('r') === 'lawyer') setRole('lawyer')
    if (q.get('e') === 'idle') setErr('انتهت الجلسة لعدم النشاط، سجّل الدخول من جديد')
    if (q.get('e') === 'ended') setErr('تم إنهاء جلستك من المالك')
    // لا دخول تلقائي: أي جلسة سابقة تُنهى قبل عرض النموذج
    fetch('/api/signout', { method: 'POST' }).catch(() => {}).finally(() => setReady(true))
  }, [])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!ready) return; setBusy(true); setErr('')
    // تجهيز الموسيقى أثناء ضغطة المستخدم (يسمح بها الموبايل لاحقًا)
    const music = new Audio('/welcome.mp3'); music.preload = 'auto'; music.volume = 0
    music.play().then(() => { music.pause(); music.currentTime = 0; music.volume = .9 }).catch(() => { music.volume = .9 })
    musicRef.current = music
    const f = new FormData(e.currentTarget)
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: f.get('email'), password: f.get('password'), role }),
    })
    const j = await r.json(); setBusy(false)
    if (r.ok) {
      // موسيقى الترحيب عند نجاح الدخول فقط، ثم الانتقال للوحة
      setWelcome(true); dest.current = j.redirect
      try { music.currentTime = 0; await music.play() } catch {}
      setTimeout(go, 9500)
    } else setErr(j.error)
  }

  if (welcome) return (
    <main dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(ellipse at 50% 40%,#2a1f0a,#000)', color: '#f3d98b', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 90, filter: 'drop-shadow(0 0 30px #d4af37)' }}>⚖️</div>
        <h1 style={{ marginTop: 12 }}>أهلًا بك في مكتب بليح</h1>
        <p style={{ opacity: .8 }}>للمحاماة والاستشارات القانونية</p>
        <button onClick={() => { musicRef.current?.pause(); go() }} style={{ marginTop: 24, padding: '10px 22px', borderRadius: 10, border: '1px solid #d4af37', background: '#000', color: '#f3d98b' }}>دخول الآن</button>
      </div>
    </main>
  )
  return (
    <main dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070605', color: '#f4ecd8' }}>
      <form action={toggleLang} style={{ position: 'fixed', top: 12, insetInlineEnd: 12 }}><button style={{ background: '#000a', color: '#f3d98b', border: '1px solid #d4af37', borderRadius: 8, padding: '4px 10px' }}>EN / عربي</button></form>
      <form onSubmit={submit} style={{ width: 'min(92vw,400px)', display: 'grid', gap: 12, padding: 24, border: '1px solid #d4af37', borderRadius: 16, boxShadow: '0 0 30px #d4af3755' }}>
        <h1 style={{ color: '#f3d98b', textAlign: 'center' }}>⚖️ تسجيل الدخول</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {ROLES.map((r) => (
            <button type="button" key={r.key} onClick={() => setRole(r.key)}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #d4af37', background: role === r.key ? '#d4af3733' : 'transparent', color: '#f3d98b' }}>{r.label}</button>
          ))}
        </div>
        <input name="email" type="text" required placeholder="اسم المستخدم" autoComplete="username" autoCapitalize="none" />
        <input name="password" type="password" required placeholder="كلمة المرور" autoComplete="current-password" />
        {err && <p style={{ color: '#ff8a7a' }}>{err}</p>}
        <button disabled={busy || !ready} style={{ padding: 12, borderRadius: 10, border: '1px solid #d4af37', background: '#000', color: '#f3d98b' }}>{busy ? '...' : 'دخول'}</button>
      </form>
    </main>
  )
}
