import { requireRole, one } from '@/lib/role'
import PrintButton from '@/app/components/PrintButton'
export default async function Receipts() {
  const { sb } = await requireRole('owner')
  const { data } = await sb.from('receipts').select('receipt_no,issued_at,payments(amount,currency,method,clients(full_name))').order('issued_at', { ascending: false }).limit(100)
  return (<div className="report">
    <style>{`@media print{nav,.np{display:none!important}body{background:#fff!important;color:#000!important}.report *{color:#000!important}}`}</style>
    <h1>🧾 الإيصالات — مكتب بليح للمحاماة</h1><p className="np"><PrintButton /></p>
    {(data ?? []).map((r: any) => { const p = one(r.payments); return (
      <div key={r.receipt_no} style={{ border: '1px solid #d4af37', padding: 12, marginTop: 10 }}>
        إيصال رقم {r.receipt_no} — {new Date(r.issued_at).toLocaleString('ar-EG')}<br />العميل: {one(p?.clients)?.full_name} — المبلغ: {p?.amount} {p?.currency} — {p?.method}</div>) })}
  </div>)
}
