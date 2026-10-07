import { NextResponse } from 'next/server'
import { serverClient, adminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// يُستدعى عند إغلاق الصفحة (sendBeacon): يعلّم لحظة المغادرة فقط، والإغلاق يتم بعد مهلة قصيرة
export async function POST() {
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return new NextResponse(null, { status: 204 })
  await adminClient().from('attendance').update({ left_at: new Date().toISOString() }).eq('lawyer_id', user.id).is('check_out', null)
  return new NextResponse(null, { status: 204 })
}
