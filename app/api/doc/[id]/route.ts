import { NextResponse } from 'next/server'
import { serverClient, adminClient } from '@/lib/supabase'
// لا روابط عامة: رابط موقّع 60 ثانية بعد التحقق من الصلاحية عبر RLS
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return new NextResponse('unauthorized', { status: 401 })
  const { data: d } = await sb.from('documents').select('id,path').eq('id', id).maybeSingle()
  if (!d) return new NextResponse('not found', { status: 404 })
  const admin = adminClient()
  const { data } = await admin.storage.from('case-docs').createSignedUrl(d.path, 60)
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'DOCUMENT_ACCESSED', entity: 'document', entity_id: id })
  return NextResponse.redirect(data!.signedUrl)
}
