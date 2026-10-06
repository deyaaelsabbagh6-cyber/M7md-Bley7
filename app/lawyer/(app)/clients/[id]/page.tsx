import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/role'
import ClientUpload from '@/app/components/ClientUpload'
const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 14, marginTop: 12, background: '#14110cb8' }
// صفحة العميل للمحامي: بياناته وقضاياه ومستنداته (بدون الحسابات المالية)
export default async function LawyerClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await requireRole('lawyer')
  const { data: c } = await sb.from('clients').select('*').eq('id', id).maybeSingle() // RLS
  if (!c) notFound()
  const [{ data: cases }, { data: docs }] = await Promise.all([
    sb.from('cases').select('id,case_number,case_type,court,status').eq('client_id', id),
    sb.from('documents').select('id,name,created_at').eq('client_id', id).order('created_at', { ascending: false }),
  ])
  return (<>
    <Link prefetch={false} href="/lawyer/clients" style={{ color: '#f3d98b' }}>← عملائي</Link>
    <h1 style={{ color: '#f3d98b' }}>👤 {c.full_name}</h1><p>{c.phone} — {c.governorate} — {c.district}</p>
    <h2>القضايا</h2>
    {(cases ?? []).map((k) => <div key={k.id} style={box}>#{k.case_number} — {k.case_type} — {k.court} — {k.status}</div>)}
    <h2>المستندات</h2>
    <div style={box}>
      <ClientUpload clientId={id} cases={(cases ?? []).map((k) => ({ id: k.id, case_number: k.case_number }))} />
      {(docs ?? []).map((d) => <p key={d.id}>📄 <a href={`/api/doc/${d.id}`} target="_blank" style={{ color: '#f3d98b' }}>{d.name}</a> — {new Date(d.created_at).toLocaleDateString('ar-EG')}</p>)}
      {!docs?.length && <p style={{ opacity: .6 }}>لا توجد مستندات.</p>}
    </div>
  </>)
}
