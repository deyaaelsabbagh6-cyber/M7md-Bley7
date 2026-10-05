import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
// يلتقط أي خطأ في عملية ويعرضه للمستخدم برسالة واضحة بدل صفحة الخطأ العامة
export async function guard(path: string, fn: () => Promise<void>) {
  try { await fn() } catch (e: any) {
    if (typeof e?.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')) throw e
    redirect(`${path}?err=${encodeURIComponent(String(e?.message ?? e).slice(0, 220))}`)
  }
}

// نفس guard لكن يعود للصفحة اللي ضغط منها المستخدم (للحذف والتعطيل)
export async function guardBack(fn: () => Promise<void>) {
  const ref = (await headers()).get('referer')
  let path = '/owner'
  try { if (ref) path = new URL(ref).pathname } catch {}
  await guard(path, fn)
}
