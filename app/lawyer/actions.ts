'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/role'
import { serverClient } from '@/lib/supabase'
import { notifyOwners, cairoTime } from '@/lib/notify'

// تسجيل الحضور بوقت السيرفر ثم الدخول للملف
export async function checkInAndGo() {
  const { admin, user, name } = await requireRole('lawyer')
  const { data: open } = await admin.from('attendance').select('id,check_in').eq('lawyer_id', user.id).is('check_out', null)
  const stale = Date.now() - 16 * 3600_000
  // جلسة قديمة لم يُسجَّل لها انصراف: تُغلق وتُعلَّم "انصراف تلقائي" بدل أن تبقى مفتوحة
  for (const o of open ?? []) if (new Date(o.check_in).getTime() < stale) await admin.from('attendance').update({ check_out: new Date().toISOString(), auto_closed: true }).eq('id', o.id)
  const { data: still } = await admin.from('attendance').select('id').eq('lawyer_id', user.id).is('check_out', null).limit(1)
  if (!still?.length) {
    const ua = (await headers()).get('user-agent')
    await admin.from('attendance').insert({ lawyer_id: user.id, user_agent: ua, last_seen: new Date().toISOString() })
    await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CHECK_IN' })
    await notifyOwners(admin, `🟢 ${name} سجّل الحضور`, `الساعة ${cairoTime()}`)
  }
  redirect('/lawyer')
}

// الخروج من الموقع = تسجيل الانصراف تلقائيًا ثم إنهاء الجلسة
export async function logoutWithCheckout() {
  const { admin, user, name } = await requireRole('lawyer')
  const { data: closed } = await admin.from('attendance').update({ check_out: new Date().toISOString() }).eq('lawyer_id', user.id).is('check_out', null).select('id')
  if (closed?.length) {
    await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CHECK_OUT' })
    await notifyOwners(admin, `🔴 ${name} سجّل الانصراف`, `الساعة ${cairoTime()}`)
  }
  await (await serverClient()).auth.signOut()
  redirect('/login')
}
