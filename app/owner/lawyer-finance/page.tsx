import { revalidatePath } from 'next/cache'
import { requireRole, one } from '@/lib/role'
async function add(f: FormData) {
  'use server'
  const { admin, user } = await requireRole('owner')
  await admin.from('lawyer_finance').insert({ lawyer_id: String(f.get('lawyer')), kind: String(f.get('kind')), amount: Number(f.get('amount')), note: String(f.get('note') || '') })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'LAWYER_FINANCE_ENTRY' })
  revalidatePath('/owner/lawyer-finance')
}
export default async function LF() {
  const { sb } = await requireRole('owner')
  const [{ data: lawyers }, { data: rows }] = await Promise.all([sb.from('lawyers').select('id,profiles(full_name)'), sb.from('lawyer_finance').select('lawyer_id,kind,amount')])
  // صافي المستحق = الأتعاب − السلف − الخصومات − ما تم صرفه
  const net = (id: string) => (rows ?? []).filter((r) => r.lawyer_id === id).reduce((s, r) => s + (r.kind === 'fee' ? 1 : -1) * Number(r.amount), 0)
  return (<>
    <h1 style={{ color: '#f3d98b' }}>مالية المحامين</h1>
    <form action={add} style={{ display: 'grid', gap: 6, maxWidth: 360 }}>
      <select name="lawyer" required>{(lawyers ?? []).map((l: any) => <option key={l.id} value={l.id}>{one(l.profiles)?.full_name}</option>)}</select>
      <select name="kind"><option value="fee">أتعاب</option><option value="advance">سلفة</option><option value="deduction">خصم</option><option value="payout">صرف</option></select>
      <input name="amount" type="number" step="0.01" min="0.01" required placeholder="المبلغ" /><input name="note" placeholder="ملاحظة" /><button>تسجيل</button></form>
    {(lawyers ?? []).map((l: any) => <p key={l.id}><b>{one(l.profiles)?.full_name}</b> — صافي المستحق: {net(l.id).toFixed(2)}</p>)}
  </>)
}
