import Link from 'next/link'
import { requireRole } from '@/lib/role'
import { addClient } from './actions'
import BulkList from '@/app/components/BulkList'
export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  const { q, show } = await searchParams
  const arch = show === 'archived'
  const { sb } = await requireRole('owner')
  let query = sb.from('clients').select('*').eq('archived', arch).order('created_at', { ascending: false }).limit(300)
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
      <p><Link prefetch={false} href={arch ? '/owner/clients' : '/owner/clients?show=archived'} style={{ color: '#f3d98b' }}>{arch ? '← العملاء النشطون' : '🗄 عرض العملاء المعطّلين'}</Link></p>
      <BulkList entity="clients" ops={arch ? ['restore', 'delete'] : ['disable', 'delete']} empty="لا يوجد عملاء." rows={(data ?? []).map((c: any) => ({ id: c.id, edit: [
        { name: 'full_name', label: 'الاسم', value: c.full_name ?? '' }, { name: 'file_no', label: 'رقم الملف', value: c.file_no ?? '' }, { name: 'phone', label: 'الهاتف', value: c.phone ?? '' },
        { name: 'governorate', label: 'المحافظة', value: c.governorate ?? '' }, { name: 'district', label: 'المركز / المنطقة', value: c.district ?? '' }, { name: 'notes', label: 'ملاحظات', value: c.notes ?? '', type: 'textarea' },
      ], node: (
        <div><Link prefetch={false} href={`/owner/clients/${c.id}`} style={{ color: '#f3d98b', fontWeight: 700 }}>{c.full_name}</Link> — {c.phone} — {c.governorate}{c.file_no ? ` — ملف ${c.file_no}` : ''}</div>) }))} />
    </>
  )
}
