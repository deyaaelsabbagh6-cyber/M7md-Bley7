import { redirect } from 'next/navigation'
// يلتقط أي خطأ في عملية ويعرضه للمستخدم برسالة واضحة بدل صفحة الخطأ العامة
export async function guard(path: string, fn: () => Promise<void>) {
  try { await fn() } catch (e: any) {
    if (typeof e?.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')) throw e
    redirect(`${path}?err=${encodeURIComponent(String(e?.message ?? e).slice(0, 220))}`)
  }
}
