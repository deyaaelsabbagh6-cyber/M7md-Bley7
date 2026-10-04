import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'
async function add(f: FormData) {
  'use server'
  const { admin, user } = await requireRole('owner')
  await admin.from('expenses').insert({ case_id: String(f.get('case') || '') || null, amount: Number(f.get('amount')), note: String(f.get('note') || '') })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'EXPENSE_CREATED' })
  revalidatePath('/owner/expenses')
}
export default async function Expenses() {
  const { sb } = await requireRole('owner')
  const [{ data }, { data: cases }] = await Promise.all([sb.from('expenses').select('*').order('created_at', { ascending: false }), sb.from('cases').select('id,case_number')])
  return (<>
    <h1 style={{ color: '#f3d98b' }}>المصروفات</h1>
    <form action={add} style={{ display: 'grid', gap: 6, maxWidth: 360 }}>
      <select name="case"><option value="">بدون قضية</option>{(cases ?? []).map((c) => <option key={c.id} value={c.id}>#{c.case_number}</option>)}</select>
      <input name="amount" type="number" step="0.01" min="0.01" required placeholder="المبلغ" /><input name="note" placeholder="ملاحظة" /><button>إضافة</button></form>
    {(data ?? []).map((e) => <p key={e.id}>{e.amount} — {e.note}</p>)}
  </>)
}
