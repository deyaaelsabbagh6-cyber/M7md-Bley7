'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
import { guard } from '@/lib/flash'
export async function addClient(f: FormData) {
  await guard('/owner/clients', async () => {
    const { admin, user } = await requireRole('owner')
    const name = String(f.get('name') || '').trim(); if (!name) throw new Error('اسم العميل مطلوب')
    const { data, error } = await admin.from('clients').insert({
      full_name: name, phone: String(f.get('phone') || '').trim() || null, governorate: String(f.get('gov') || '').trim() || null, district: String(f.get('district') || '').trim() || null,
      file_no: String(f.get('file_no') || '').trim() || null,
    }).select('id').single()
    if (error) throw new Error(error.code === '23505' ? 'رقم الملف مستخدم من قبل' : 'تعذّر الحفظ: ' + error.message)
    await admin.from('audit_logs').insert({ actor_id: user.id, action: 'USER_CREATED', entity: 'client', entity_id: data?.id })
    revalidatePath('/owner/clients')
  })
}
export async function archiveClient(id: string) {
  const { admin, user } = await requireRole('owner')
  await admin.from('clients').update({ archived: true }).eq('id', id)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CLIENT_ARCHIVED', entity: 'client', entity_id: id })
  revalidatePath('/owner/clients')
}
