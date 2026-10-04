'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'

export async function addFee(id: string, f: FormData) {
  const { admin, user } = await requireRole('owner')
  const amount = Number(f.get('amount')); if (!(amount > 0)) throw new Error('مبلغ غير صحيح')
  await admin.from('fees').insert({ client_id: id, case_id: String(f.get('case') || '') || null, amount, note: String(f.get('note') || '') })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'FEE_CREATED', entity: 'client', entity_id: id })
  revalidatePath(`/owner/clients/${id}`)
}
export async function addClientPayment(id: string, f: FormData) {
  const { admin, user } = await requireRole('owner')
  const amount = Number(f.get('amount')); if (!(amount > 0)) throw new Error('مبلغ غير صحيح')
  const method = String(f.get('method')) === 'transfer' ? 'transfer' : 'cash'
  const { data: pay, error } = await admin.from('payments').insert({ client_id: id, case_id: String(f.get('case') || '') || null, amount, method, status: 'success', paid_at: new Date().toISOString(), provider_ref: `manual-${crypto.randomUUID()}` }).select('id').single()
  if (error) throw new Error(error.message)
  await admin.from('receipts').insert({ payment_id: pay.id })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'PAYMENT_SUCCESS', entity: 'payment', entity_id: pay.id })
  revalidatePath(`/owner/clients/${id}`)
}

export async function updateClient(id: string, f: FormData) {
  const { admin, user } = await requireRole('owner')
  const name = String(f.get('name') || '').trim(); if (!name) throw new Error('اسم العميل مطلوب')
  const t = (k: string) => String(f.get(k) || '').trim() || null
  const { error } = await admin.from('clients').update({
    full_name: name, file_no: t('file_no'), phone: t('phone'), email: t('email'), governorate: t('gov'), district: t('district'), notes: t('notes'),
  }).eq('id', id)
  if (error) throw new Error(error.code === '23505' ? 'رقم الملف مستخدم من قبل' : error.message)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CLIENT_UPDATED', entity: 'client', entity_id: id })
  revalidatePath(`/owner/clients/${id}`); revalidatePath('/owner/clients')
}
