import { requireRole } from '@/lib/role'
export default async function Cases() {
  const { sb } = await requireRole('lawyer') // RLS يعيد قضاياه فقط
  const { data } = await sb.from('cases').select('id,case_number,case_type,court,status,clients(id,full_name,phone)').order('created_at', { ascending: false })
  return (
    <>
      <h1 style={{ color: '#f3d98b' }}>قضاياي</h1>
      {(data ?? []).map((c: any) => {
        const k = Array.isArray(c.clients) ? c.clients[0] : c.clients
        return <div key={c.id} style={{ border: '1px solid #d4af3788', borderRadius: 14, padding: 14, marginTop: 10 }}>
          <a href={`/lawyer/cases/${c.id}`} style={{ color: '#f3d98b', fontWeight: 700 }}>#{c.case_number}</a> — {c.case_type} — {c.court} — {c.status}<br />العميل: <a href={`/lawyer/clients/${k?.id}`} style={{ color: '#f3d98b' }}>{k?.full_name}</a> {k?.phone}</div>
      })}
      {!data?.length && <p style={{ opacity: .6 }}>لا توجد قضايا مسندة إليك.</p>}
    </>
  )
}
