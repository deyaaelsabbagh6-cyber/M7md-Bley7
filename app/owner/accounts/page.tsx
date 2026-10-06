import { requireRole, one } from '@/lib/role'
import { addFee, addExpense, addLawyerEntry } from './actions'
import BulkList from '@/app/components/BulkList'
const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 12, marginTop: 8, background: '#14110cb8' }
const tile = (on: boolean) => ({ ...box, display: 'block', textAlign: 'center' as const, textDecoration: 'none', color: '#f3d98b', marginTop: 0, boxShadow: on ? '0 0 22px #d4af37aa' : 'none' })
const money = (n: number) => `${n.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`
const KIND: Record<string, string> = { fee: 'أتعاب', advance: 'سلفة', deduction: 'خصم', payout: 'صرف' }
export default async function Accounts({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = 'fees' } = await searchParams
  const { sb } = await requireRole('owner')
  const [{ data: fees }, { data: pays }, { data: clients }, { data: lf }, { data: exps }, { data: recs }, { data: lawyers }, { data: cases }] = await Promise.all([
    sb.from('fees').select('id,client_id,amount,note,created_at,clients(full_name)').order('created_at', { ascending: false }),
    sb.from('payments').select('id,client_id,amount,method,status,created_at,clients(full_name)').eq('status', 'success').order('created_at', { ascending: false }),
    sb.from('clients').select('id,full_name').eq('archived', false),
    sb.from('lawyer_finance').select('id,lawyer_id,kind,amount,note,created_at,lawyers(profiles(full_name))').order('created_at', { ascending: false }),
    sb.from('expenses').select('id,amount,note,created_at').order('created_at', { ascending: false }),
    sb.from('receipts').select('receipt_no,issued_at,payments(amount,clients(full_name))').order('issued_at', { ascending: false }).limit(100),
    sb.from('lawyers').select('id,profiles(full_name)').eq('archived', false),
    sb.from('cases').select('id,case_number'),
  ])
  const sum = (a: any[] | null, f: (x: any) => boolean = () => true) => (a ?? []).filter(f).reduce((s, x) => s + Number(x.amount), 0)
  const totFees = sum(fees), totPaid = sum(pays), totExp = sum(exps)
  const lk = (k: string) => sum(lf, (x) => x.kind === k)
  const nameOf = (x: any) => one(one(x.lawyers)?.profiles)?.full_name ?? ''
  const TABS: [string, string, string, string][] = [
    ['fees', '📑', 'أتعاب', money(totFees)], ['paid', '🤲', 'المدفوع', money(totPaid)], ['rem', '⏳', 'المتبقي', money(totFees - totPaid)],
    ['adv', '💵', 'السلف والخصومات', money(lk('advance') + lk('deduction'))], ['exp', '🧾', 'المصروفات', money(totExp)],
    ['net', '💰', 'صافي المستحق', money(lk('fee') - lk('advance') - lk('deduction') - lk('payout'))], ['rec', '🧾', 'الإيصالات', `${recs?.length ?? 0} إيصال`],
  ]
  const lawyerOpts = (lawyers ?? []).map((l: any) => <option key={l.id} value={l.id}>{one(l.profiles)?.full_name}</option>)
  return (<>
    <h1 style={{ color: '#f3d98b' }}>🪙 الحسابات</h1>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
      {TABS.map(([k, i, l, v]) => <a key={k} href={`?t=${k}`} style={tile(t === k)}><div style={{ fontSize: 26 }}>{i}</div><b>{l}</b><br /><small>{v}</small></a>)}
    </div>
    {t === 'fees' && <>
      <form action={addFee} style={{ ...box, display: 'grid', gap: 6, maxWidth: 380 }}><b>➕ إضافة أتعاب</b>
        <select name="client" required><option value="">العميل</option>{(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select>
        <select name="case"><option value="">القضية (اختياري)</option>{(cases ?? []).map((c) => <option key={c.id} value={c.id}>#{c.case_number}</option>)}</select>
        <input name="amount" type="number" step="0.01" min="0.01" required placeholder="المبلغ" /><input name="note" placeholder="ملاحظة" /><button>إضافة</button></form>
      <BulkList entity="fees" ops={['delete']} empty="لا أتعاب مسجلة." rows={(fees ?? []).map((x: any) => ({ id: x.id, edit: [{ name: 'amount', label: 'المبلغ', value: String(x.amount), type: 'number' }, { name: 'note', label: 'ملاحظة', value: x.note ?? '' }], node: <div>{one(x.clients)?.full_name} — {money(Number(x.amount))} {x.note && `— ${x.note}`}</div> }))} /></>}
    {t === 'paid' && <>{(pays ?? []).map((x: any) => <div key={x.id} style={box}>{one(x.clients)?.full_name} — {money(Number(x.amount))} — {x.method === 'cash' ? 'نقدًا' : 'تحويل'} — {new Date(x.created_at).toLocaleDateString('ar-EG')}</div>)}<p><a href="/owner/payments" style={{ color: '#f3d98b' }}>تسجيل دفعة جديدة ←</a></p></>}
    {t === 'rem' && (clients ?? []).map((c) => { const f = sum(fees, (x) => x.client_id === c.id), p = sum(pays, (x) => x.client_id === c.id); return <div key={c.id} style={box}><b>{c.full_name}</b> — الأتعاب {money(f)} — المدفوع {money(p)} — المتبقي <b>{money(f - p)}</b></div> })}
    {(t === 'adv') && <>
      <form action={addLawyerEntry} style={{ ...box, display: 'grid', gap: 6, maxWidth: 380 }}><b>➕ قيد مالي لمحامٍ</b>
        <select name="lawyer" required><option value="">المحامي</option>{lawyerOpts}</select>
        <select name="kind"><option value="fee">أتعاب</option><option value="advance">سلفة</option><option value="deduction">خصم</option><option value="payout">صرف</option></select>
        <input name="amount" type="number" step="0.01" min="0.01" required placeholder="المبلغ" /><input name="note" placeholder="ملاحظة" /><button>تسجيل</button></form>
      <BulkList entity="lawyer_finance" ops={['delete']} empty="لا قيود." rows={(lf ?? []).filter((x: any) => x.kind !== 'fee').map((x: any) => ({ id: x.id, edit: [{ name: 'amount', label: 'المبلغ', value: String(x.amount), type: 'number' }, { name: 'note', label: 'ملاحظة', value: x.note ?? '' }], node: <div>{nameOf(x)} — {KIND[x.kind]} — {money(Number(x.amount))} {x.note && `— ${x.note}`}</div> }))} /></>}
    {t === 'exp' && <>
      <form action={addExpense} style={{ ...box, display: 'grid', gap: 6, maxWidth: 380 }}><b>➕ إضافة مصروف</b>
        <select name="case"><option value="">بدون قضية</option>{(cases ?? []).map((c) => <option key={c.id} value={c.id}>#{c.case_number}</option>)}</select>
        <input name="amount" type="number" step="0.01" min="0.01" required placeholder="المبلغ" /><input name="note" placeholder="البند" /><button>إضافة</button></form>
      <BulkList entity="expenses" ops={['delete']} empty="لا مصروفات." rows={(exps ?? []).map((x: any) => ({ id: x.id, edit: [{ name: 'amount', label: 'المبلغ', value: String(x.amount), type: 'number' }, { name: 'note', label: 'البند', value: x.note ?? '' }], node: <div>{money(Number(x.amount))} — {x.note} — {new Date(x.created_at).toLocaleDateString('ar-EG')}</div> }))} /></>}
    {t === 'net' && (lawyers ?? []).map((l: any) => { const g = (k: string) => sum(lf, (x) => x.lawyer_id === l.id && x.kind === k); return <div key={l.id} style={box}><b>{one(l.profiles)?.full_name}</b> — أتعاب {money(g('fee'))} — سلف {money(g('advance'))} — خصومات {money(g('deduction'))} — صرف {money(g('payout'))} — <b>الصافي {money(g('fee') - g('advance') - g('deduction') - g('payout'))}</b></div> })}
    {t === 'rec' && <>{(recs ?? []).map((r: any) => <div key={r.receipt_no} style={box}>إيصال #{r.receipt_no} — {one(one(r.payments)?.clients)?.full_name} — {money(Number(one(r.payments)?.amount))} — {new Date(r.issued_at).toLocaleDateString('ar-EG')}</div>)}<p><a href="/owner/receipts" style={{ color: '#f3d98b' }}>صفحة الطباعة ←</a></p></>}
  </>)
}
