'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverClient } from '@/lib/supabase'
export async function toggleLang() {
  const c = await cookies(); c.set('lang', c.get('lang')?.value === 'en' ? 'ar' : 'en', { path: '/', maxAge: 31536000 })
  revalidatePath('/', 'layout')
}

export async function signOutAction() {
  await (await serverClient()).auth.signOut()
  redirect('/login')
}
