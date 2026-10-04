import { redirect } from 'next/navigation'
import { serverClient, adminClient } from './supabase'

export async function requireRole(role: 'owner' | 'lawyer') {
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: p } = await sb.from('profiles').select('role,is_active,full_name').eq('id', user.id).single()
  if (!p?.is_active || p.role !== role) redirect('/login')
  return { sb, admin: adminClient(), user, name: p.full_name as string }
}
const one = <T,>(x: T | T[] | null) => (Array.isArray(x) ? x[0] : x)
export { one }
