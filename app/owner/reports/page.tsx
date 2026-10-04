import { requireRole, one } from '@/lib/role'
import PrintButton from '@/app/components/PrintButton'
export default async function Reports({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = 'cases' } = await searchParams
  const { sb } = await requireRole('owner')
  let head: string[] = [], rows: (string | number)[][] = []
  if (t === 'clients') { const { data } = await sb.from('clients').select('full_name,phone,governorate'); head = ['الاسم', 'الهاتف', 'المحافظة']; rows = (data ?? []).map((r) => [r.full_name, r.phone ?? '', r.governorate ?? '']) }
  if (t === 'cases') { const { data } = await sb.from('cases').select('case_number,case_type,court,status,clients(full_name)'); head = ['الرقم', 'النوع', 'المحكمة', 'الحالة', 'العميل']; rows = (data ?? []).map((r: any) => [r.case_number, r.case_type ?? '', r.court ?? '', r.status, one(r.clients)?.full_name ?? '']) }
  if (t === 'payments') { const { data } = await sb.from('payments').select('amount,currency,status,method,created_at'); head = ['المبلغ', 'العملة', 'الحالة', 'الطريقة', 'التاريخ']; rows = (data ?? []).map((r) => [r.amount, r.currency, r.status, r.method ?? '', new Date(r.created_at).toLocaleDateString('ar-EG')]) }
  if (t === 'attendance') { const { data } = await sb.from('attendance').select('check_in,check_out,lawyers(profiles(full_name))'); head = ['المحامي', 'حضور', 'انصراف']; rows = (data ?? []).map((r: any) => [one(one(r.lawyers)?.profiles)?.full_name ?? '', new Date(r.check_in).toLocaleString('ar-EG'), r.check_out ? new Date(r.check_out).toLocaleString('ar-EG') : '—']) }
  return (<div className="report">
    <style>{`@media print{nav,.np{display:none!important}body{background:#fff!important;color:#000!important}.report *{color:#000!important}}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d4af37;padding:6px}`}</style>
    <h1>تقرير {t} — مكتب بليح للمحاماة</h1>
    <p className="np">{['clients', 'cases', 'payments', 'attendance'].map((k) => <a key={k} href={`?t=${k}`} style={{ marginInlineEnd: 10 }}>{k}</a>)} <PrintButton /></p>
    <table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
  </div>)
}
