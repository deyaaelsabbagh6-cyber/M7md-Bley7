'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { serverClient, adminClient } from '@/lib/supabase'
export async function changePassword(f: FormData) {
  const sb = await serverClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const { data: p } = await sb.from('profiles').select('role,full_name').eq('id', user.id).single()
  const cur = String(f.get('cur')), next = String(f.get('next')), min = p?.role === 'owner' ? 12 : 10
  if (next.length < min) throw new Error(`كلمة المرور الجديدة ${min} أحرف على الأقل`)
  const chk = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const { error: e1 } = await chk.auth.signInWithPassword({ email: user.email!, password: cur })
  if (e1) throw new Error('كلمة المرور الحالية غير صحيحة')
  const { error } = await sb.auth.updateUser({ password: next })
  if (error) throw new Error(error.message)
  const admin = adminClient()
  await admin.from('audit_logs').insert({ actor_id: user.id, action: 'PASSWORD_CHANGE', entity: 'user', entity_id: user.id }) // بدون كلمة المرور
  if (p?.role === 'lawyer') {
    const { data: owners } = await admin.from('profiles').select('id').eq('role', 'owner').eq('is_active', true)
    if (owners?.length) await admin.from('notifications').insert(owners.map((o) => ({ user_id: o.id, title: `المحامي ${p.full_name} غيّر كلمة المرور` })))
  }
  redirect(p?.role === 'owner' ? '/owner/settings?ok=1' : '/lawyer/settings?ok=1')
}
