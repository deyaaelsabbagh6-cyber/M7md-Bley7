'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/role'

type T = 'text' | 'num' | 'dt'
const SPEC: Record<string, { fields: Record<string, T>; req: string[] }> = {
  clients: { fields: { full_name: 'text', file_no: 'text', phone: 'text', governorate: 'text', district: 'text', notes: 'text' }, req: ['full_name'] },
  cases: { fields: { case_number: 'text', title: 'text', case_type: 'text', court: 'text', governorate: 'text', district: 'text', notes: 'text' }, req: ['case_number'] },
  documents: { fields: { name: 'text' }, req: ['name'] },
  hearings: { fields: { hearing_at: 'dt', court: 'text', notes: 'text' }, req: ['hearing_at'] },
  tasks: { fields: { title: 'text', due_at: 'dt' }, req: ['title'] },
  fees: { fields: { amount: 'num', note: 'text' }, req: ['amount'] },
  expenses: { fields: { amount: 'num', note: 'text' }, req: ['amount'] },
  lawyer_finance: { fields: { amount: 'num', note: 'text' }, req: ['amount'] },
}
const PROFILE = ['full_name', 'phone', 'username']

function clean(fields: Record<string, T>, req: string[], v: Record<string, string>) {
  const out: Record<string, any> = {}
  for (const [k, t] of Object.entries(fields)) {
    if (!(k in v)) continue
    const raw = String(v[k] ?? '').trim()
    if (!raw) { if (req.includes(k)) throw new Error('أكمل الحقول المطلوبة'); out[k] = null; continue }
    if (t === 'num') { const n = Number(raw); if (!(n > 0)) throw new Error('مبلغ غير صحيح'); out[k] = n }
    else if (t === 'dt') { if (isNaN(new Date(raw).getTime())) throw new Error('تاريخ غير صحيح'); out[k] = raw }
    else out[k] = raw
  }
  return out
}

export async function updateRecord(entity: string, id: string, values: Record<string, string>): Promise<{ ok: boolean; msg: string }> {
  try {
    const { admin, user } = await requireRole('owner')
    if (entity === 'lawyers' || entity === 'owners') {
      const p: Record<string, any> = {}
      for (const k of PROFILE) if (k in values) p[k] = String(values[k] ?? '').trim() || null
      if (!p.full_name && 'full_name' in values) throw new Error('الاسم مطلوب')
      if ('username' in values) {
        const u = String(values.username ?? '').trim().toLowerCase()
        if (!/^[a-z0-9._-]{3,30}$/.test(u)) throw new Error('اسم المستخدم: حروف إنجليزية وأرقام من 3 إلى 30')
        p.username = u
      }
      const { error } = await admin.from('profiles').update(p).eq('id', id).eq('role', entity === 'lawyers' ? 'lawyer' : 'owner')
      if (error) throw new Error(error.code === '23505' ? 'اسم المستخدم مستخدم من قبل' : error.message)
      if (entity === 'lawyers') {
        const l: Record<string, any> = {}
        for (const k of ['employee_id', 'specialty']) if (k in values) l[k] = String(values[k] ?? '').trim() || null
        if (Object.keys(l).length) { const { error: e2 } = await admin.from('lawyers').update(l).eq('id', id); if (e2) throw new Error(e2.code === '23505' ? 'الرقم الوظيفي مستخدم من قبل' : e2.message) }
      }
    } else {
      const s = SPEC[entity]; if (!s) throw new Error('غير مدعوم')
      const { error } = await admin.from(entity).update(clean(s.fields, s.req, values)).eq('id', id)
      if (error) throw new Error(error.code === '23505' ? 'القيمة مستخدمة من قبل (رقم مكرر)' : error.message)
    }
    await admin.from('audit_logs').insert({ actor_id: user.id, action: 'RECORD_UPDATED', entity, entity_id: id })
    revalidatePath('/owner', 'layout'); revalidatePath('/lawyer', 'layout')
    return { ok: true, msg: 'تم حفظ التعديل' }
  } catch (e: any) {
    if (typeof e?.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')) throw e
    return { ok: false, msg: e?.message ?? 'حدث خطأ' }
  }
}
