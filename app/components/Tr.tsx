'use client'
import { useEffect } from 'react'
import { EN } from '@/lib/en'

const AR = /[\u0600-\u06FF]/
const ESC = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// يطابق العبارة كاملة فقط (لا يقطع كلمة عربية من منتصفها)
const PAIRS: [RegExp, string][] = EN.map(([a, b]) => [new RegExp('(?<![\\u0600-\\u06FF])' + ESC(a) + '(?![\\u0600-\\u06FF])', 'g'), b])
const DIG = '٠١٢٣٤٥٦٧٨٩'
function tr(x: string) {
  if (!AR.test(x) && !/[٠-٩٬٫]/.test(x)) return x
  for (const [r, b] of PAIRS) x = x.replace(r, b)
  return x.replace(/[٠-٩]/g, (d) => String(DIG.indexOf(d))).replace(/٬/g, ',').replace(/٫/g, '.')
}
function run(root: Node) {
  document.querySelectorAll('[dir="rtl"]').forEach((e) => e.setAttribute('dir', 'ltr'))
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (w.nextNode()) nodes.push(w.currentNode as Text)
  nodes.forEach((n) => {
    const p = n.parentElement?.tagName
    if (p === 'SCRIPT' || p === 'STYLE') return
    const t = tr(n.nodeValue ?? '')
    if (t !== n.nodeValue) n.nodeValue = t
  })
  if (root instanceof Element) root.querySelectorAll('[placeholder],[title]').forEach((e) => {
    for (const a of ['placeholder', 'title']) { const v = e.getAttribute(a); if (v) { const t = tr(v); if (t !== v) e.setAttribute(a, t) } }
  })
  if (root instanceof Element) root.querySelectorAll('option').forEach((o) => { const t = tr(o.textContent ?? ''); if (t !== o.textContent) o.textContent = t })
}
// ترجمة الواجهة داخل اللوحات عند اختيار English (تتابع الصفحات الجديدة تلقائيًا)
export default function Tr({ lang }: { lang: 'ar' | 'en' }) {
  useEffect(() => {
    if (lang !== 'en') return
    run(document.body)
    let t: any
    const ob = new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { ob.disconnect(); run(document.body); ob.observe(document.body, { childList: true, subtree: true, characterData: true }) }, 30) })
    ob.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => { ob.disconnect(); clearTimeout(t) }
  }, [lang])
  return null
}
