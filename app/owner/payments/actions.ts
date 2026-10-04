'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
export async function refund(id: string, f: FormData) {
  const { admin, user } = await requireRole('owner')
  const { data: p } = await admin.from('payments').select('amount,status,client_id').eq('id', id).single()
  if (p?.status !== 'success') throw new Error('لا يمكن استرداد عملية غير ناجحة')
  const reason = String(f.get('reason') || '').trim(); if (!reason) throw new Error('سبب الاسترداد مطلوب')
  // تنبيه: الاسترداد الفعلي للأموال يتم عبر API المزود؛ هنا نسجّل الطلب ونحدّث الحالة
  await admin.from('refunds').insert({ payment_id: id, amount: p.amount, reason, created_by: user.id })
  await admin.from('payments').update({ status: 'refunded' }).eq('id', id)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'REFUND_CREATED', entity: 'payment', entity_id: id })
  const { data: k } = await admin.from('clients').select('profile_id').eq('id', p.client_id).single()
  if (k?.profile_id) await admin.from('notifications').insert({ user_id: k.profile_id, title: 'تم تسجيل استرداد لمبلغ مدفوع' })
  revalidatePath('/owner/payments')
}

export async function recordPayment(f: FormData) {
  const { admin, user } = await requireRole('owner')
  const amount = Number(f.get('amount')); if (!(amount > 0)) throw new Error('مبلغ غير صحيح')
  const { data: pay, error } = await admin.from('payments').insert({
    client_id: String(f.get('client')), case_id: String(f.get('case') || '') || null, amount,
    method: String(f.get('method') || 'cash'), status: 'success', paid_at: new Date().toISOString(),
  }).select('id').single()
  if (error) throw new Error(error.message)
  await admin.from('receipts').insert({ payment_id: pay.id })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'PAYMENT_SUCCESS', entity: 'payment', entity_id: pay.id, meta: { manual: true } })
  revalidatePath('/owner/payments')
}
