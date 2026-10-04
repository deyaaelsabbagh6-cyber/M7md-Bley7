'use server'
import { revalidatePath } from 'next/cache'
import { guard } from '@/lib/flash'
import { requireOwner } from '@/lib/owner'

async function createOwnerImpl(f: FormData) {
  const { admin, user } = await requireOwner()
  const username = String(f.get('username')).trim().toLowerCase(), name = String(f.get('name')).trim(), pw = String(f.get('password'))
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error('اسم المستخدم: حروف إنجليزية وأرقام 3-30')
  if (pw.length < 10) throw new Error('كلمة مرور المالك 10 أحرف على الأقل')
  const { data, error } = await admin.auth.admin.createUser({ email: `${username}@baleeh.local`, password: pw, email_confirm: true, user_metadata: { full_name: name } })
  if (error || !data.user) throw new Error(error?.message ?? 'فشل الإنشاء')
  const id = data.user.id
  // يبقى معطّلًا حتى يعتمده مالك حالي
  await admin.from('profiles').update({ role: 'owner', username, full_name: name, is_active: false }).eq('id', id)
  await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' })
  const { data: owners } = await admin.from('profiles').select('id').eq('role', 'owner').eq('is_active', true)
  if (owners?.length) await admin.from('notifications').insert(owners.map((o) => ({ user_id: o.id, title: `طلب اعتماد مالك جديد: ${name}`, body: 'راجع صفحة المالكين للاعتماد أو الرفض' })))
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'OWNER_CREATED_PENDING', entity: 'owner', entity_id: id })
  revalidatePath('/owner/owners')
}
export async function approveOwner(id: string) {
  const { admin, user } = await requireOwner()
  // اعتماد مالك جديد من صلاحية المالك الأساسي (الأقدم) فقط
  const { data: first } = await admin.from('profiles').select('id').eq('role', 'owner').eq('is_active', true).order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (first?.id !== user.id) throw new Error('اعتماد المالك الجديد من صلاحية المالك الأساسي فقط')
  await admin.from('profiles').update({ is_active: true }).eq('id', id).eq('role', 'owner')
  await admin.auth.admin.updateUserById(id, { ban_duration: 'none' })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'OWNER_APPROVED', entity: 'owner', entity_id: id })
  revalidatePath('/owner/owners')
}
export async function disableOwner(id: string) {
  const { admin, user } = await requireOwner()
  if (id === user.id) throw new Error('لا يمكنك تعطيل حسابك')
  await admin.from('profiles').update({ is_active: false, force_logout_at: new Date().toISOString() }).eq('id', id).eq('role', 'owner')
  await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'OWNER_DISABLED', entity: 'owner', entity_id: id })
  revalidatePath('/owner/owners')
}

export async function createOwner(f: FormData) { await guard('/owner/owners', () => createOwnerImpl(f)) }
