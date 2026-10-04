'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
export async function setStatus(id: string, status: 'accepted' | 'done') {
  const { admin, user } = await requireRole('lawyer')
  const { data: a } = await admin.from('assignments').update({ status }).eq('id', id).eq('lawyer_id', user.id).select('created_by,case_id').single()
  if (a?.created_by) await admin.from('notifications').insert({ user_id: a.created_by, title: status === 'done' ? 'تم تنفيذ طلب أرسلته لمحامٍ' : 'تم استلام طلب أرسلته لمحامٍ' })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'ASSIGNMENT_' + status.toUpperCase(), entity: 'assignment', entity_id: id })
  revalidatePath('/lawyer/requests')
}
