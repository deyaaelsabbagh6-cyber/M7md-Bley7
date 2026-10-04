import Link from 'next/link'
import { requireRole } from '@/lib/role'
import ClientUpload from '@/app/components/ClientUpload'
import { addFee, addClientPayment, updateClient } from './actions'

const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 14, marginTop: 12, background: '#14110cb8' }
const money = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 2 })

// صفحة العميل: بياناته + قضاياه + مستنداته (والرفع) + حساباته
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await requireRole('owner')
  const { data: c } = await sb.from('clients').select('*').eq('id', id).single()
  const [{ data: cases }, { data: docs }, { data: fees }, { data: pays }] = await Promise.all([
    sb.from('cases').select('id,case_number,case_type,court,status').eq('client_id', id),
    sb.from('documents').select('id,name,size,created_at,case_id').eq('client_id', id).order('created_at', { ascending: false }),
    sb.from('fees').select('amount,note,created_at').eq('client_id', id),
    sb.from('payments').select('id,amount,method,status,created_at,receipts(receipt_no)').eq('client_id', id).order('created_at', { ascending: false }),
  ])
  const caseIds = (cases ?? []).map((x) => x.id)
  const { data: exps } = caseIds.length ? await sb.from('expenses').select('amount').in('case_id', caseIds) : { data: [] as { amount: number }[] }
  const total = (fees ?? []).reduce((s, x) => s + Number(x.amount), 0)
  const paid = (pays ?? []).filter((p) => p.status === 'success').reduce((s, p) => s + Number(p.amount), 0)
  const expenses = (exps ?? []).reduce((s, x) => s + Number(x.amount), 0)
  const opts = (cases ?? []).map((k) => <option key={k.id} value={k.id}>#{k.case_number}</option>)
  return (<>
    <Link href="/owner/clients" style={{ color: '#f3d98b' }}>← العملاء</Link>
    <h1 style={{ color: '#f3d98b' }}>👤 {c?.full_name}</h1>
    <p>{c?.phone} — {c?.governorate} — {c?.district}</p>
    <p style={{ opacity: .8 }}>رقم الملف: {c?.file_no ?? '—'} — {c?.email ?? ''}</p>
    <form action={updateClient.bind(null, id)} style={{ display: 'grid', gap: 6, maxWidth: 460, margin: '10px 0' }}>
      <b>✏️ تعديل بيانات العميل كاملة</b>
      <input name="name" required defaultValue={c?.full_name ?? ''} placeholder="الاسم" />
      <input name="file_no" defaultValue={c?.file_no ?? ''} placeholder="رقم الملف" />
      <input name="phone" defaultValue={c?.phone ?? ''} placeholder="الهاتف" />
      <input name="email" type="email" defaultValue={c?.email ?? ''} placeholder="البريد الإلكتروني" />
      <input name="gov" defaultValue={c?.governorate ?? ''} placeholder="المحافظة" />
      <input name="district" defaultValue={c?.district ?? ''} placeholder="المركز" />
      <textarea name="notes" rows={3} defaultValue={c?.notes ?? ''} placeholder="ملاحظات" />
      <button>حفظ التعديلات</button>
    </form>

    <h2>القضايا</h2>
    {(cases ?? []).map((k) => <div key={k.id} style={box}>#{k.case_number} — {k.case_type} — {k.court} — {k.status}</div>)}
    {!cases?.length && <p style={{ opacity: .6 }}>لا توجد قضايا لهذا العميل.</p>}

    <h2>المستندات</h2>
    <div style={box}>
      <ClientUpload clientId={id} cases={(cases ?? []).map((k) => ({ id: k.id, case_number: k.case_number }))} />
      {(docs ?? []).map((d) => <p key={d.id}>📄 <a href={`/api/doc/${d.id}`} target="_blank" style={{ color: '#f3d98b' }}>{d.name}</a> — {new Date(d.created_at).toLocaleDateString('ar-EG')}</p>)}
      {!docs?.length && <p style={{ opacity: .6 }}>لا توجد مستندات.</p>}
    </div>

    <h2>الحسابات</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
      {[['الأتعاب', total], ['المدفوع', paid], ['المتبقي', total - paid], ['المصروفات', expenses]].map(([l, v]) => <div key={l as string} style={box}><div style={{ opacity: .7 }}>{l}</div><b style={{ fontSize: 22, color: '#f3d98b' }}>{money(v as number)}</b></div>)}
    </div>
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      <form action={addFee.bind(null, id)} style={{ ...box, display: 'grid', gap: 6, minWidth: 240 }}>
        <b>تحديد أتعاب</b><input name="amount" type="number" step="0.01" min="0.01" required placeholder="المبلغ" />
        <select name="case"><option value="">عامة</option>{opts}</select><input name="note" placeholder="ملاحظة" /><button>إضافة</button></form>
      <form action={addClientPayment.bind(null, id)} style={{ ...box, display: 'grid', gap: 6, minWidth: 240 }}>
        <b>تسجيل دفعة مستلمة</b><input name="amount" type="number" step="0.01" min="0.01" required placeholder="المبلغ" />
        <select name="case"><option value="">عامة</option>{opts}</select>
        <select name="method"><option value="cash">نقدًا</option><option value="transfer">تحويل بنكي</option></select><button>تسجيل وإصدار إيصال</button></form>
    </div>
    <h3>الدفعات والإيصالات</h3>
    {(pays ?? []).map((p: any) => <p key={p.id}>{money(Number(p.amount))} — {p.method === 'transfer' ? 'تحويل' : 'نقدًا'} — {p.status} — إيصال: {(Array.isArray(p.receipts) ? p.receipts[0] : p.receipts)?.receipt_no ?? '—'}</p>)}
    <Link href="/owner/receipts" style={{ color: '#f3d98b' }}>🧾 كل الإيصالات</Link>
  </>)
}
