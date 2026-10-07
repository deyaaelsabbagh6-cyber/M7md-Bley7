import { notifyOwners, cairoTime } from './notify'

// الانصراف التلقائي: المحامي الذي غادر الموقع يُسجَّل له انصراف بوقت مغادرته الفعلي
//  - أغلق التبويب/المتصفح: يُعلَّم left_at فورًا، ويُغلق السجل إن لم يعد خلال 45 ثانية
//    (إعادة تحميل الصفحة تعود في ثوانٍ فلا تُحتسب مغادرة)
//  - انقطع الاتصال أو توقف المتصفح: يُغلق السجل بعد دقيقتين من آخر ظهور
export const LEFT_GRACE_MS = 45_000
export const IDLE_MS = 120_000

export async function sweepStale(admin: any) {
  const { data } = await admin.from('attendance').select('id,lawyer_id,check_in,last_seen,left_at').is('check_out', null)
  const now = Date.now()
  for (const r of data ?? []) {
    if (!r.last_seen && !r.left_at) continue // سجل قديم قبل هذه الخاصية: يُترك لمنطق الـ16 ساعة
    const left = r.left_at ? new Date(r.left_at).getTime() : null
    const seen = new Date(r.last_seen ?? r.check_in).getTime()
    const goneFast = left !== null && now - left > LEFT_GRACE_MS
    const goneSlow = now - seen > IDLE_MS
    if (!goneFast && !goneSlow) continue
    const at = new Date(Math.max(new Date(r.check_in).getTime(), left ?? seen)).toISOString()
    const { data: done } = await admin.from('attendance').update({ check_out: at, auto_closed: true }).eq('id', r.id).is('check_out', null).select('id')
    if (!done?.length) continue
    const { data: p } = await admin.from('profiles').select('full_name').eq('id', r.lawyer_id).maybeSingle()
    await admin.from('audit_logs').insert({ actor_id: r.lawyer_id, action: 'CHECK_OUT_AUTO' })
    await notifyOwners(admin, `🔴 ${p?.full_name ?? 'محامٍ'} غادر الموقع`, `تم تسجيل الانصراف تلقائيًا الساعة ${cairoTime(new Date(at))}`)
  }
}
