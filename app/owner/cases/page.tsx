import { requireRole, one } from '@/lib/role'
import { addCase, addHearing } from './actions'
import BulkList from '@/app/components/BulkList'
export default async function Cases({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const arch = (await searchParams).show === 'archived'
  const { sb } = await requireRole('owner')
  const [{ data: cases }, { data: clients }, { data: lawyers }] = await Promise.all([
    (arch ? sb.from('cases').select('id,case_number,case_type,court,status,clients(full_name)').eq('status', 'archived') : sb.from('cases').select('id,case_number,case_type,court,status,clients(full_name)').neq('status', 'archived')).order('created_at', { ascending: false }),
    sb.from('clients').select('id,full_name').eq('archived', false),
    sb.from('lawyers').select('id,profiles(full_name)'),
  ])
  return (
    <>
      <h1 style={{ color: '#f3d98b' }}>القضايا</h1>
      <p><a href="/api/export/cases" style={{ color: '#f3d98b' }}>⬇️ تصدير</a></p>
      <form action={addCase} style={{ display: 'grid', gap: 6, maxWidth: 400, margin: '10px 0' }}>
        <b>قضية جديدة</b><input name="no" required placeholder="رقم القضية" /><input name="title" placeholder="اسم القضية" /><input name="type" placeholder="النوع" />
        <input name="court" placeholder="المحكمة" /><input name="gov" placeholder="المحافظة" /><input name="district" placeholder="المركز" />
        <select name="client" required><option value="">العميل</option>{(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select>
        <select name="lawyer"><option value="">المحامي المسؤول</option>{(lawyers ?? []).map((l: any) => <option key={l.id} value={l.id}>{one(l.profiles)?.full_name}</option>)}</select>
        <button>إنشاء</button>
      </form>
      <p><a href={arch ? '/owner/cases' : '/owner/cases?show=archived'} style={{ color: '#f3d98b' }}>{arch ? '← القضايا النشطة' : '🗄 عرض القضايا المؤرشفة'}</a></p>
      <BulkList entity="cases" ops={arch ? ['restore', 'delete'] : ['disable', 'delete']} empty="لا توجد قضايا." rows={(cases ?? []).map((c: any) => ({ id: c.id, node: (
        <div>
          <a href={`/owner/cases/${c.id}`} style={{ color: '#f3d98b', fontWeight: 700 }}>#{c.case_number}</a> — {c.case_type} — {c.court} — {one(c.clients)?.full_name} — {c.status}
          <form action={addHearing.bind(null, c.id)} style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <input name="at" type="datetime-local" required /><input name="court" placeholder="المحكمة" /><button>+ جلسة</button></form>
        </div>) }))} />
    </>
  )
}
