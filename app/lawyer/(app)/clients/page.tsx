import Link from 'next/link'
import { requireRole } from '@/lib/role'
export default async function Clients() {
  const { sb } = await requireRole('lawyer') // RLS: عملاء قضاياه فقط
  const { data } = await sb.from('clients').select('id,full_name,phone,governorate').eq('archived', false).order('full_name')
  return (<>
    <h1 style={{ color: '#f3d98b' }}>عملائي</h1>
    {(data ?? []).map((c) => <div key={c.id} style={{ border: '1px solid #d4af3788', borderRadius: 14, padding: 12, marginTop: 8 }}>
      <Link prefetch={false} href={`/lawyer/clients/${c.id}`} style={{ color: '#f3d98b', fontWeight: 700 }}>{c.full_name}</Link> — {c.phone} — {c.governorate}</div>)}
    {!data?.length && <p style={{ opacity: .6 }}>لا يوجد عملاء مرتبطون بقضاياك.</p>}
  </>)
}
