import { cache } from 'react'
import { redirect } from 'next/navigation'
import { serverClient, adminClient } from './supabase'

// استعلام واحد للمستخدم والملف الشخصي في الطلب الواحد مهما تكرر الاستدعاء
const session = cache(async () => {
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { sb, user: null as any, p: null as any }
  const { data: p } = await sb.from('profiles').select('role,is_active,full_name,force_logout_at').eq('id', user.id).single()
  return { sb, user, p }
})

export async function requireRole(role: 'owner' | 'lawyer') {
  const { sb, user, p } = await session()
  if (!user) redirect('/login')
  if (!p?.is_active || p.role !== role) redirect('/login')
  // إنهاء الجلسات من مركز الأمان
  if (p.force_logout_at && new Date(user.last_sign_in_at ?? 0) < new Date(p.force_logout_at)) redirect('/login?e=ended')
  return { sb, admin: adminClient(), user, name: p.full_name as string }
}
const one = <T,>(x: T | T[] | null) => (Array.isArray(x) ? x[0] : x)
export { one }
