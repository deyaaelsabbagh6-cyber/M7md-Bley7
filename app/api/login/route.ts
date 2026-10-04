import { NextResponse } from 'next/server'
import { serverClient, adminClient } from '@/lib/supabase'

// محدّد معدل بسيط في الذاكرة (للإنتاج استخدم Upstash/Redis)
const hits = new Map<string, { n: number; t: number }>()
function limited(key: string) {
  const now = Date.now(), h = hits.get(key)
  if (!h || now - h.t > 15 * 60_000) { hits.set(key, { n: 1, t: now }); return false }
  return ++h.n > 8
}

export async function POST(req: Request) {
  const { email: ident, password, role } = await req.json()
  let email = String(ident ?? '').trim()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? null
  const ua = req.headers.get('user-agent')
  const admin = adminClient()

  if (limited(`${ip}:${email}`)) {
    await admin.from('security_events').insert({ event: 'RATE_LIMITED', ip, user_agent: ua })
    return NextResponse.json({ error: 'محاولات كثيرة، حاول بعد 15 دقيقة' }, { status: 429 })
  }

  if (!email.includes('@')) {
    // اسم مستخدم: نجلب البريد الداخلي المرتبط به من السيرفر
    const { data: pr } = await admin.from('profiles').select('id').eq('username', email.toLowerCase()).maybeSingle()
    const { data: u } = pr ? await admin.auth.admin.getUserById(pr.id) : { data: null }
    email = u?.user?.email ?? ''
  }
  const sb = await serverClient()
  const { data, error } = await sb.auth.signInWithPassword({ email: email || 'invalid@invalid.invalid', password })
  if (error || !data.user) {
    // لا نسجّل كلمة المرور أبدًا
    await admin.from('security_events').insert({ event: 'FAILED_LOGIN', ip, user_agent: ua })
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
  }

  const { data: p } = await admin.from('profiles').select('role,is_active').eq('id', data.user.id).single()
  if (!p?.is_active || p.role !== role) {
    await sb.auth.signOut()
    await admin.from('security_events').insert({ user_id: data.user.id, event: 'ROLE_MISMATCH', ip, user_agent: ua })
    return NextResponse.json({ error: 'هذا الحساب غير مخصص لهذه البوابة' }, { status: 403 })
  }

  await admin.from('audit_logs').insert({ actor_id: data.user.id, action: 'LOGIN', ip, user_agent: ua })
  const out = NextResponse.json({ redirect: '/' + p.role })
  out.cookies.set('last_seen', String(Date.now()), { path: '/', httpOnly: true, secure: true, sameSite: 'lax' })
  return out
}
