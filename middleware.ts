import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AREAS = ['owner', 'lawyer'] as const
const IDLE_MS = 20 * 60 * 1000 // بعد 20 دقيقة خمول يُطلب الدخول من جديد
const opts = { path: '/', httpOnly: true, secure: true, sameSite: 'lax' as const }

function kill(req: NextRequest, to: string) {
  const r = NextResponse.redirect(new URL(to, req.url))
  req.cookies.getAll().forEach((c) => { if (c.name.startsWith('sb-') || c.name === 'last_seen') r.cookies.delete(c.name) })
  return r
}

export async function middleware(req: NextRequest) {
  const area = AREAS.find((a) => req.nextUrl.pathname.startsWith('/' + a))
  if (!area) return NextResponse.next()

  const last = Number(req.cookies.get('last_seen')?.value ?? 0)
  if (!last || Date.now() - last > IDLE_MS) return kill(req, '/login?e=idle')

  let res = NextResponse.next({ request: req })
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        res = NextResponse.next({ request: req })
        list.forEach(({ name, value, options }) => { const { maxAge, expires, ...o } = (options ?? {}) as any; res.cookies.set(name, value, o) })
      },
    },
  })
  const { data: { user } } = await sb.auth.getUser() // تحقق من السيرفر وليس من الكوكي فقط
  if (!user) return kill(req, '/login')

  const { data: p } = await sb.from('profiles').select('role,is_active,force_logout_at').eq('id', user.id).single()
  if (!p?.is_active || p.role !== area) return kill(req, '/login')
  // إنهاء الجلسات من مركز الأمان: أي دخول أقدم من وقت الإنهاء يُلغى
  if (p.force_logout_at && new Date(user.last_sign_in_at ?? 0) < new Date(p.force_logout_at)) { await sb.auth.signOut(); return kill(req, '/login?e=ended') }

  res.cookies.set('last_seen', String(Date.now()), opts)
  return res
}
export const config = { matcher: ['/owner/:path*', '/lawyer/:path*'] }
