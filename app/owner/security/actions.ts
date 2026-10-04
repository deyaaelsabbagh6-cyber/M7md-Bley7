'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
// إنهاء كل جلسات مستخدم: أي دخول أقدم من هذه اللحظة يُلغى عند أول طلب، ويُسجَّل انصراف المحامي
export async function endSessions(id: string) {
  const { admin, user } = await requireRole('owner')
  if (id === user.id) throw new Error('لا يمكنك إنهاء جلستك الحالية من هنا')
  await admin.from('profiles').update({ force_logout_at: new Date().toISOString() }).eq('id', id)
  await admin.from('attendance').update({ check_out: new Date().toISOString(), auto_closed: true }).eq('lawyer_id', id).is('check_out', null)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'SESSION_ENDED', entity: 'user', entity_id: id })
  revalidatePath('/owner/security')
}
