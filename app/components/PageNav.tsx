'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// السابق ← ⚖️ → التالي: حسب ترتيب القائمة الجانبية
export default function PageNav({ items }: { items: [string, string, string][] }) {
  const p = usePathname()
  let idx = -1, len = 0
  items.forEach(([h], i) => { if ((p === h || p.startsWith(h + '/')) && h.length >= len) { idx = i; len = h.length } })
  if (idx < 0) return null
  const prev = items[idx - 1], next = items[idx + 1]
  return (
    <div className="pnav">
      {prev ? <Link className="bp" href={prev[0]}>→ السابق: {prev[1]}</Link> : <span />}
      <span className="pnav-c">⚖️</span>
      {next ? <Link className="bp" href={next[0]}>التالي: {next[1]} ←</Link> : <span />}
    </div>
  )
}
