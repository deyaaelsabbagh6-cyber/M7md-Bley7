'use server'
import { revalidatePath } from 'next/cache'
import { guard } from '@/lib/flash'
import { requireOwner } from '@/lib/owner'

async function createLawyerImpl(f: FormData) {
  const { admin, user } = await requireOwner()
  const username = String(f.get('username')).trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error('اسم المستخدم: حروف إنجليزية وأرقام 3-30')
  const email = `${username}@baleeh.local`, password = String(f.get('password')), name = String(f.get('name'))
  if (password.length < 10) throw new Error('كلمة المرور أقل من 10 أحرف')
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } })
  if (error || !data.user) throw new Error(error?.message ?? 'فشل الإنشاء')
  const id = data.user.id
  await admin.from('profiles').update({ role: 'lawyer', is_active: true, username, full_name: name, phone: String(f.get('phone') || '') }).eq('id', id)
  await admin.from('lawyers').insert({ id, employee_id: String(f.get('emp') || '') || null, specialty: String(f.get('specialty') || '') || null })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'USER_CREATED', entity: 'lawyer', entity_id: id }) // بدون كلمة المرور
  revalidatePath('/owner/lawyers')
}

export async function toggleLawyer(id: string, active: boolean) {
  const { admin, user } = await requireOwner()
  await admin.from('profiles').update({ is_active: active }).eq('id', id)
  await admin.auth.admin.updateUserById(id, { ban_duration: active ? 'none' : '876000h' })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'PERMISSION_CHANGED', entity: 'lawyer', entity_id: id, meta: { is_active: active } })
  revalidatePath('/owner/lawyers')
}

export async function resetLawyerPassword(id: string, f: FormData) {
  const { admin, user } = await requireOwner()
  const pw = String(f.get('pw'))
  if (pw.length < 10) throw new Error('كلمة المرور أقل من 10 أحرف')
  await admin.auth.admin.updateUserById(id, { password: pw })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'PASSWORD_CHANGE', entity: 'lawyer', entity_id: id })
}

export async function updateLawyer(id: string, f: FormData) {
  const { admin, user } = await requireOwner()
  await admin.from('profiles').update({ full_name: String(f.get('name')), phone: String(f.get('phone') || '') }).eq('id', id)
  await admin.from('lawyers').update({ employee_id: String(f.get('emp') || '') || null, specialty: String(f.get('specialty') || '') || null }).eq('id', id)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'PERMISSION_CHANGED', entity: 'lawyer', entity_id: id, meta: { edited: true } })
  revalidatePath('/owner/lawyers'); revalidatePath(`/owner/lawyers/${id}`)
}

// أرشفة المحامي: يختفي من القوائم ويُعطَّل دخوله مع بقاء كل سجلاته
export async function archiveLawyer(id: string) {
  const { admin, user } = await requireOwner()
  await admin.from('lawyers').update({ archived: true }).eq('id', id)
  await admin.from('profiles').update({ is_active: false, force_logout_at: new Date().toISOString() }).eq('id', id)
  await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'USER_ARCHIVED', entity: 'lawyer', entity_id: id })
  revalidatePath('/owner/lawyers')
}

const KINDS: Record<string, string> = { new_case: 'قضية جديدة', investigation: 'طلب تحريات', memo: 'طلب مذكرة', hearing: 'حضور جلسة', other: 'طلب آخر' }

// إرسال قضية أو طلب (تحريات / مذكرة / جلسة ...) للمحامي المختص مع إشعار فوري
export async function sendAssignment(f: FormData) {
  const { admin, user } = await requireOwner()
  const caseId = String(f.get('case')), lawyer = String(f.get('lawyer')), kind = String(f.get('kind')), note = String(f.get('note') || '').trim()
  if (!KINDS[kind]) throw new Error('نوع الطلب غير صحيح')
  if (!caseId || !lawyer) throw new Error('اختر القضية والمحامي')
  const { data: c } = await admin.from('cases').select('case_number,lead_lawyer_id').eq('id', caseId).single()
  await admin.from('assignments').insert({ case_id: caseId, lawyer_id: lawyer, kind, note: note || null, created_by: user.id })
  if (kind === 'new_case' || !c?.lead_lawyer_id) await admin.from('cases').update({ lead_lawyer_id: lawyer }).eq('id', caseId)
  else await admin.from('case_lawyers').upsert({ case_id: caseId, lawyer_id: lawyer })
  await admin.from('notifications').insert({ user_id: lawyer, title: `${KINDS[kind]} — قضية ${c?.case_number}`, body: note || null })
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'CASE_ASSIGNED', entity: 'case', entity_id: caseId, meta: { lawyer, kind } })
  revalidatePath('/owner/lawyers'); revalidatePath(`/owner/lawyers/${lawyer}`)
}

export async function createLawyer(f: FormData) { await guard('/owner/lawyers', () => createLawyerImpl(f)) }
