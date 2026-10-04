import { requireRole, one } from '@/lib/role'
import { refund, recordPayment } from './actions'
export default async function Pays() {
  const { sb } = await requireRole('owner')
  const { data } = await sb.from('payments').select('id,amount,currency,status,method,created_at,clients(full_name)').order('created_at', { ascending: false }).limit(100)
  const [{ data: clients }, { data: cases }] = await Promise.all([sb.from('clients').select('id,full_name').eq('archived', false), sb.from('cases').select('id,case_number')])
  const total = (data ?? []).filter((p) => p.status === 'success').reduce((s, p) => s + Number(p.amount), 0)
  return (
    <>
      <h1 style={{ color: '#f3d98b' }}>المدفوعات — إجمالي الناجح: {total.toFixed(2)} ج.م</h1>
      <form action={recordPayment} style={{ display: 'grid', gap: 6, maxWidth: 380, margin: '10px 0' }}>
        <a href="/api/export/payments" style={{ color: '#f3d98b' }}>⬇️ تصدير</a>
        <b>تسجيل دفعة</b>
        <select name="client" required><option value="">العميل</option>{(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select>
        <select name="case"><option value="">القضية (اختياري)</option>{(cases ?? []).map((c) => <option key={c.id} value={c.id}>#{c.case_number}</option>)}</select>
        <input name="amount" type="number" step="0.01" min="0.01" required placeholder="المبلغ" />
        <select name="method"><option value="cash">نقدًا</option><option value="transfer">تحويل</option></select>
        <button>تسجيل وإصدار إيصال</button></form>
      {(data ?? []).map((p: any) => <div key={p.id} style={{ border: '1px solid #d4af3788', borderRadius: 14, padding: 12, marginTop: 8 }}>
        {one(p.clients)?.full_name} — {p.amount} {p.currency} — {p.method} — <b>{p.status}</b>
        {p.status === 'success' && <form action={refund.bind(null, p.id)} style={{ display: 'flex', gap: 6, marginTop: 6 }}><input name="reason" required placeholder="سبب الاسترداد" /><button>استرداد</button></form>}</div>)}
    </>
  )
}
