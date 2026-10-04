'use server'
import { revalidatePath } from 'next/cache'
import { serverClient } from '@/lib/supabase'
// الإشعار يخص صاحبه فقط (سياسة RLS تمنع تعديل إشعار غيره)
export async function markRead(id: string) {
  await (await serverClient()).from('notifications').update({ read: true }).eq('id', id)
  revalidatePath('/', 'layout')
}
export async function markAll() {
  const sb = await serverClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) return
  await sb.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  revalidatePath('/', 'layout')
}
