import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// حالة خفيفة للتحديث التلقائي: عدد الإشعارات غير المقروءة + بصمة الحضور والانصراف
// (الصلاحيات تُطبَّق تلقائيًا: المالك يرى الكل والمحامي يرى حضوره فقط)
export async function GET() {
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ auth: false }, { status: 401 })
  const [n, a] = await Promise.all([
    sb.from('notifications').select('id', { count: 'exact' }).eq('read', false).order('created_at', { ascending: false }).limit(1),
    sb.from('attendance').select('id,check_in,check_out').order('check_in', { ascending: false }).limit(10),
  ])
  return NextResponse.json(
    { unread: n.count ?? 0, latest: n.data?.[0]?.id ?? null, att: (a.data ?? []).map((r) => `${r.id}:${r.check_in}:${r.check_out ?? ''}`).join('|') },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
