'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
const num = (v: FormDataEntryValue | null) => { const n = Number(v); if (!(n > 0)) throw new Error('مبلغ غير صحيح'); return n }
export async function addFee(f: FormData) {
  const { admin, user } = await requireRole('owner')
  await admin.from('fees').insert({ client_id: String(f.get('client')), case_id: String(f.get('case') || '') || null, amount: num(f.get('amount')), note: String(f.get('note') || '') || null })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'FEE_CREATED', entity: 'client', entity_id: String(f.get('client')) })
  revalidatePath('/owner/accounts')
}
export async function addExpense(f: FormData) {
  const { admin, user } = await requireRole('owner')
  await admin.from('expenses').insert({ case_id: String(f.get('case') || '') || null, amount: num(f.get('amount')), note: String(f.get('note') || '') || null })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'EXPENSE_CREATED' })
  revalidatePath('/owner/accounts')
}
export async function addLawyerEntry(f: FormData) {
  const { admin, user } = await requireRole('owner')
  const kind = String(f.get('kind')); if (!['fee', 'advance', 'deduction', 'payout'].includes(kind)) throw new Error('نوع غير صحيح')
  await admin.from('lawyer_finance').insert({ lawyer_id: String(f.get('lawyer')), kind, amount: num(f.get('amount')), note: String(f.get('note') || '') || null })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'LAWYER_FINANCE_ENTRY', entity: 'lawyer', entity_id: String(f.get('lawyer')) })
  revalidatePath('/owner/accounts')
}
