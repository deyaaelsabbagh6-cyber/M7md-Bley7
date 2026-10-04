'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
export async function addClient(f: FormData) {
  const { admin, user } = await requireRole('owner')
  const { data } = await admin.from('clients').insert({
    full_name: String(f.get('name')), phone: String(f.get('phone') || ''), governorate: String(f.get('gov') || ''), district: String(f.get('district') || ''),
    file_no: String(f.get('file_no') || '').trim() || null, email: String(f.get('email') || '').trim() || null,
  }).select('id').single()
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'USER_CREATED', entity: 'client', entity_id: data?.id })
  revalidatePath('/owner/clients')
}
export async function archiveClient(id: string) {
  const { admin, user } = await requireRole('owner')
  await admin.from('clients').update({ archived: true }).eq('id', id)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CLIENT_ARCHIVED', entity: 'client', entity_id: id })
  revalidatePath('/owner/clients')
}
