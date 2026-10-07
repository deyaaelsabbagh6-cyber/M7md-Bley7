'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type S = { unread: number; latest: string | null; att: string }

// تحديث تلقائي مستمر: يفحص كل 8 ثواني (أبطأ لو التبويب مخفي)، يحدّث الصفحة عند أي جديد،
// ويشغّل صوت التنبيه عند وصول إشعار جديد
export default function LiveWatcher({ role }: { role?: 'owner' | 'lawyer' }) {
  const router = useRouter(), path = usePathname()
  const last = useRef<S | null>(null), audio = useRef<HTMLAudioElement | null>(null), muted = useRef(false)
  const [mute, setMute] = useState(false)

  useEffect(() => {
    muted.current = localStorage.getItem('notifSound') === 'off'; setMute(muted.current)
    const a = new Audio('/notify.mp3'); a.preload = 'auto'; audio.current = a
    // المتصفح يمنع الصوت قبل أول لمسة: نجهّزه عند أول تفاعل
    const unlock = () => { a.volume = 0; a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 1 }).catch(() => { a.volume = 1 }) }
    addEventListener('pointerdown', unlock, { once: true })
    // إغلاق الصفحة/المتصفح: نعلّم المغادرة فورًا (الانصراف يُسجَّل تلقائيًا بعد مهلة قصيرة)
    const leave = () => { if (role === 'lawyer') navigator.sendBeacon?.('/api/attendance/leave') }
    addEventListener('pagehide', leave)
    let timer: ReturnType<typeof setTimeout>, dead = false
    async function tick() {
      if (dead) return
      if (!document.hidden) {
        try {
          const r = await fetch('/api/live', { cache: 'no-store' })
          if (r.status === 401) { location.href = '/login'; return }
          const j: S = await r.json(), p = last.current
          if (p) {
            if (j.unread > p.unread && !muted.current) { audio.current?.play().catch(() => {}); navigator.vibrate?.(200) }
            if (j.unread !== p.unread || j.latest !== p.latest || j.att !== p.att) router.refresh()
          }
          last.current = j
        } catch {}
      }
      timer = setTimeout(tick, document.hidden ? 20000 : 8000)
    }
    tick()
    const vis = () => { if (!document.hidden) { clearTimeout(timer); tick() } }
    document.addEventListener('visibilitychange', vis)
    return () => { dead = true; clearTimeout(timer); document.removeEventListener('visibilitychange', vis); removeEventListener('pointerdown', unlock); removeEventListener('pagehide', leave) }
  }, [router, role])

  // صفحة الحضور: تحديث كل نصف دقيقة لتبقى الأوقات حيّة
  useEffect(() => {
    if (!path.endsWith('/attendance')) return
    const i = setInterval(() => { if (!document.hidden) router.refresh() }, 30000)
    return () => clearInterval(i)
  }, [path, router])

  return (
    <button className="bt" title={mute ? 'تشغيل صوت الإشعارات' : 'كتم صوت الإشعارات'} onClick={() => { const m = !mute; setMute(m); muted.current = m; localStorage.setItem('notifSound', m ? 'off' : 'on'); if (!m) audio.current?.play().catch(() => {}) }}>
      {mute ? '🔕' : '🔔'}<span style={{ marginInlineStart: 6, fontSize: 12, opacity: .7 }}>صوت</span>
    </button>
  )
}
