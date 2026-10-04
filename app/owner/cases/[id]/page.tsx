import { requireRole } from '@/lib/role'
import CaseFile from '@/app/components/CaseFile'
import { updateCase } from '../actions'
export default async function P({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { sb } = await requireRole('owner')
  const { data: c } = await sb.from('cases').select('case_number,title,case_type,status,court,governorate,district,notes').eq('id', id).maybeSingle()
  return (
    <CaseFile sb={sb} id={id} base="/owner">
      <form action={updateCase.bind(null, id)} style={{ display: 'grid', gap: 6, maxWidth: 460, margin: '10px 0' }}>
        <b>✏️ تعديل بيانات القضية كاملة</b>
        <input name="no" required defaultValue={c?.case_number ?? ''} placeholder="رقم القضية" />
        <input name="title" defaultValue={c?.title ?? ''} placeholder="اسم القضية" />
        <input name="type" defaultValue={c?.case_type ?? ''} placeholder="نوع القضية" />
        <input name="court" defaultValue={c?.court ?? ''} placeholder="المحكمة" />
        <input name="gov" defaultValue={c?.governorate ?? ''} placeholder="المحافظة" />
        <input name="district" defaultValue={c?.district ?? ''} placeholder="المركز" />
        <select name="status" defaultValue={c?.status}><option value="open">قيد المتابعة</option><option value="pending">معلقة</option><option value="closed">مكتملة</option><option value="archived">مؤرشفة</option></select>
        <textarea name="notes" rows={3} defaultValue={c?.notes ?? ''} placeholder="ملاحظات" />
        <button>حفظ التعديلات</button>
      </form>
    </CaseFile>
  )
}
