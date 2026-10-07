import { NextResponse } from 'next/server'
import { serverClient, adminClient } from '@/lib/supabase'
import { sweepStale } from '@/lib/attendance'

export const dynamic = 'force-dynamic'

// حالة خفيفة للتحديث التلقائي + نبضة حضور المحامي + إغلاق من غادروا الموقع
export async function GET() {
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ auth: false }, { status: 401 })
  const admin = adminClient()
  // نبضة: المحامي ما زال في الموقع (تُلغي علامة المغادرة لو كانت إعادة تحميل)
  await admin.from('attendance').update({ last_seen: new Date().toISOString(), left_at: null }).eq('lawyer_id', user.id).is('check_out', null)
  await sweepStale(admin)
  const [n, a] = await Promise.all([
    sb.from('notifications').select('id', { count: 'exact' }).eq('read', false).order('created_at', { ascending: false }).limit(1),
    sb.from('attendance').select('id,check_in,check_out').order('check_in', { ascending: false }).limit(10),
  ])
  return NextResponse.json(
    { unread: n.count ?? 0, latest: n.data?.[0]?.id ?? null, att: (a.data ?? []).map((r) => `${r.id}:${r.check_in}:${r.check_out ?? ''}`).join('|') },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
