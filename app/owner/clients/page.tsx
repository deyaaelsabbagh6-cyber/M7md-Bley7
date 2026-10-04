import Link from 'next/link'
import { requireRole } from '@/lib/role'
import { addClient, archiveClient } from './actions'
export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const { sb } = await requireRole('owner')
  let query = sb.from('clients').select('*').eq('archived', false).order('created_at', { ascending: false })
  if (q) query = query.or(`full_name.ilike.%${q.replace(/[%,()]/g, '')}%,phone.ilike.%${q.replace(/[%,()]/g, '')}%`)
  const { data } = await query
  return (
    <>
      <h1 style={{ color: '#f3d98b' }}>العملاء</h1>
      <p><a href="/api/export/clients" style={{ color: '#f3d98b' }}>⬇️ تصدير</a></p>
      <form style={{ margin: '8px 0' }}><input name="q" defaultValue={q} placeholder="بحث بالاسم أو الهاتف" /> <button>بحث</button></form>
      <form action={addClient} style={{ display: 'grid', gap: 6, maxWidth: 380, margin: '10px 0' }}>
        <b>إضافة عميل</b><input name="file_no" placeholder="رقم الملف" /><input name="name" required placeholder="الاسم" /><input name="phone" placeholder="الهاتف" />
        <input name="gov" placeholder="المحافظة" /><input name="district" placeholder="المركز / المنطقة" /><button>إضافة</button>
      </form>
      {(data ?? []).map((c) => <div key={c.id} style={{ border: '1px solid #d4af3788', borderRadius: 14, padding: 12, marginTop: 8 }}>
        <Link href={`/owner/clients/${c.id}`} style={{ color: '#f3d98b', fontWeight: 700 }}>{c.full_name}</Link> — {c.phone} — {c.governorate}
        <form action={archiveClient.bind(null, c.id)} style={{ display: 'inline', marginInlineStart: 10 }}><button>أرشفة</button></form></div>)}
    </>
  )
}
