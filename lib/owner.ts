import { redirect } from 'next/navigation'
import { serverClient, adminClient } from './supabase'

// تحقق من السيرفر أن المستخدم مالك — يُستدعى في كل صفحة وكل action
export async function requireOwner() {
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: p } = await sb.from('profiles').select('role,is_active').eq('id', user.id).single()
  if (!p?.is_active || p.role !== 'owner') redirect('/login')
  return { sb, admin: adminClient(), user }
}
