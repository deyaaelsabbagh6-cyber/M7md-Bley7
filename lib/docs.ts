import { serverClient, adminClient } from './supabase'
import { headers } from 'next/headers'

const OK = ['application/pdf', 'image/jpeg', 'image/png']
const MAX = 25 * 1024 * 1024

// يتحقق (عبر RLS) أن المستخدم مالك/محامٍ وله صلاحية على العميل أو القضية
async function actorFor(o: { clientId?: string | null; caseId?: string | null }) {
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('unauthorized')
  const { data: p } = await sb.from('profiles').select('role,is_active').eq('id', user.id).single()
  if (!p?.is_active || !['owner', 'lawyer'].includes(p.role)) throw new Error('forbidden')
  let clientId = o.clientId ?? null, caseId = o.caseId ?? null
  if (caseId) {
    const { data: c } = await sb.from('cases').select('id,client_id').eq('id', caseId).maybeSingle()
    if (!c) throw new Error('forbidden')
    clientId = c.client_id
  } else {
    if (!clientId) throw new Error('missing target')
    const { data: k } = await sb.from('clients').select('id').eq('id', clientId).maybeSingle()
    if (!k) throw new Error('forbidden')
  }
  return { user, clientId: clientId as string, caseId }
}
function check(name: string, type: string, size: number) {
  if (size > MAX) throw new Error('الملف أكبر من 25MB')
  if (!OK.includes(type)) throw new Error('النوع غير مسموح (PDF أو JPG أو PNG فقط)')
}

// الخطوة 1: رابط رفع موقّع مباشر إلى التخزين الخاص (يتجاوز حد حجم السيرفر)
export async function prepareDocUpload(o: { clientId?: string | null; caseId?: string | null; name: string; type: string; size: number }) {
  const a = await actorFor(o); check(o.name, o.type, o.size)
  const path = `clients/${a.clientId}/${crypto.randomUUID()}`
  const { data, error } = await adminClient().storage.from('case-docs').createSignedUploadUrl(path)
  if (error || !data) throw new Error(error?.message ?? 'فشل التجهيز')
  return { path, token: data.token }
}
// الخطوة 2: تسجيل المستند في قاعدة البيانات بعد اكتمال الرفع
export async function finalizeDocUpload(o: { clientId?: string | null; caseId?: string | null; path: string; name: string; type: string; size: number }) {
  const a = await actorFor(o); check(o.name, o.type, o.size)
  if (!o.path.startsWith(`clients/${a.clientId}/`)) throw new Error('bad path')
  const admin = adminClient()
  const { data: d, error } = await admin.from('documents').insert({ client_id: a.clientId, case_id: a.caseId, name: o.name, path: o.path, mime: o.type, size: o.size, uploaded_by: a.user.id }).select('id').single()
  if (error) throw new Error(error.message)
  await admin.from('audit_logs').insert({ actor_id: a.user.id, action: 'DOCUMENT_UPLOADED', entity: 'document', entity_id: d.id, ip: (await headers()).get('x-forwarded-for')?.split(',')[0] ?? null })
  return d.id as string
}
// رفع مباشر من السيرفر (يستخدمه الماسح للملفات الصغيرة)
export async function saveDocument(o: { clientId?: string | null; caseId?: string | null; file: File }) {
  const a = await actorFor(o); check(o.file.name, o.file.type, o.file.size)
  const path = `clients/${a.clientId}/${crypto.randomUUID()}`
  const admin = adminClient()
  const { error } = await admin.storage.from('case-docs').upload(path, o.file, { contentType: o.file.type })
  if (error) throw new Error(error.message)
  return finalizeDocUpload({ ...o, clientId: a.clientId, path, name: o.file.name, type: o.file.type, size: o.file.size })
}
