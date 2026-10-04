import { NextResponse } from 'next/server'
import { serverClient, adminClient } from '@/lib/supabase'
// يُستدعى عند فتح صفحة الدخول: أي جلسة قديمة تُنهى (ويُسجَّل انصراف المحامي) فيُطلب الدخول بالبيانات كل مرة
export async function POST() {
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (user) {
    const admin = adminClient()
    const { data: closed } = await admin.from('attendance').update({ check_out: new Date().toISOString() }).eq('lawyer_id', user.id).is('check_out', null).select('id')
    if (closed?.length) await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CHECK_OUT' })
    await sb.auth.signOut()
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('last_seen')
  return res
}
