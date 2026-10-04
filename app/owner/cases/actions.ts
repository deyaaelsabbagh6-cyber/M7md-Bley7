'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
export async function addCase(f: FormData) {
  const { admin, user } = await requireRole('owner')
  const lawyer = String(f.get('lawyer') || '') || null
  const { data, error } = await admin.from('cases').insert({
    case_number: String(f.get('no')), title: String(f.get('title') || '') || null, case_type: String(f.get('type') || ''), court: String(f.get('court') || ''),
    governorate: String(f.get('gov') || ''), district: String(f.get('district') || ''),
    client_id: String(f.get('client')), lead_lawyer_id: lawyer,
  }).select('id').single()
  if (error) throw new Error(error.message)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CASE_CREATED', entity: 'case', entity_id: data.id })
  if (lawyer) {
    await admin.from('notifications').insert({ user_id: lawyer, title: `تم تعيينك على قضية ${f.get('no')}` })
    await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CASE_ASSIGNED', entity: 'case', entity_id: data.id })
  }
  revalidatePath('/owner/cases')
}
export async function addHearing(caseId: string, f: FormData) {
  const { admin } = await requireRole('owner')
  await admin.from('hearings').insert({ case_id: caseId, hearing_at: String(f.get('at')), court: String(f.get('court') || '') })
  revalidatePath('/owner/cases')
}

export async function updateCase(id: string, f: FormData) {
  const { admin, user } = await requireRole('owner')
  const status = String(f.get('status'))
  if (!['open', 'pending', 'closed', 'archived'].includes(status)) throw new Error('حالة غير صحيحة')
  const no = String(f.get('no') || '').trim(); if (!no) throw new Error('رقم القضية مطلوب')
  const t = (k: string) => String(f.get(k) || '').trim() || null
  const { error } = await admin.from('cases').update({
    case_number: no, title: t('title'), case_type: t('type'), court: t('court'), governorate: t('gov'), district: t('district'),
    status, notes: t('notes'),
  }).eq('id', id)
  if (error) throw new Error(error.code === '23505' ? 'رقم القضية مستخدم من قبل' : error.message)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CASE_UPDATED', entity: 'case', entity_id: id, meta: { status } })
  revalidatePath(`/owner/cases/${id}`); revalidatePath('/owner/cases')
}
