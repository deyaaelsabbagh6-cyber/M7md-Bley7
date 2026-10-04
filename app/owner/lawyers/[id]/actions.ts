'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
export async function addTask(id: string, f: FormData) {
  const { admin, user } = await requireRole('owner')
  await admin.from('tasks').insert({ lawyer_id: id, title: String(f.get('title')), case_id: String(f.get('case') || '') || null, due_at: String(f.get('due') || '') || null })
  await admin.from('notifications').insert({ user_id: id, title: `مهمة جديدة: ${f.get('title')}` })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'OWNER_ACTION_ON_LAWYER', entity: 'task', entity_id: id })
  revalidatePath(`/owner/lawyers/${id}`)
}
export async function setLead(id: string, f: FormData) {
  const { admin, user } = await requireRole('owner')
  await admin.from('cases').update({ lead_lawyer_id: id }).eq('id', String(f.get('case')))
  await admin.from('notifications').insert({ user_id: id, title: 'تم إسناد قضية جديدة إليك' })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CASE_ASSIGNED', entity: 'case', entity_id: String(f.get('case')), meta: { lawyer: id } })
  revalidatePath(`/owner/lawyers/${id}`)
}
