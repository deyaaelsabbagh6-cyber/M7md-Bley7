import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function serverClient() {
  const store = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      // كوكيز جلسة فقط (بدون مدة) فتنتهي بإغلاق المتصفح ويُطلب الدخول من جديد
      setAll: (list) => list.forEach(({ name, value, options }) => {
        const { maxAge, expires, ...o } = (options ?? {}) as any
        store.set(name, value, { ...o, httpOnly: true, secure: true, sameSite: 'lax' })
      }),
    },
  })
}

// للكتابة في السجلات فقط (يتجاوز RLS) - يُستخدم من السيرفر حصرًا
export const adminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
