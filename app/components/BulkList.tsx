'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bulkApply } from './bulk-actions'

const LABEL: Record<string, string> = { disable: '🚫 تعطيل', enable: '✅ تفعيل', delete: '🗑 حذف', restore: '↩️ استرجاع', read: '✔️ مقروء' }
const ASK: Record<string, string> = { disable: 'تعطيل', enable: 'تفعيل', delete: 'حذف نهائي', restore: 'استرجاع', read: 'تعليم كمقروء' }

// قائمة بتحديد متعدد + إجراءات على المحدد + أزرار لكل عنصر
export default function BulkList({ entity, ops, rows, empty }: { entity: string; ops: string[]; rows: { id: string; node: React.ReactNode; ops?: string[] }[]; empty?: string }) {
  const [sel, setSel] = useState<string[]>([]), [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null), [pending, start] = useTransition(), router = useRouter()
  const all = rows.length > 0 && sel.length === rows.length
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  function run(op: string, ids: string[]) {
    if (!ids.length) return setMsg({ ok: false, t: 'حدّد عنصرًا واحدًا على الأقل' })
    if ((op === 'delete' || op === 'disable') && !confirm(`تأكيد ${ASK[op]} لعدد ${ids.length} عنصر؟`)) return
    start(async () => { const r = await bulkApply(entity, op, ids); setMsg({ ok: r.ok, t: r.msg }); setSel([]); router.refresh() })
  }
  return (
    <div>
      {rows.length > 0 && (
        <div className="pn" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '10px 0' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={all} onChange={() => setSel(all ? [] : rows.map((r) => r.id))} /> تحديد الكل ({sel.length})</label>
          {ops.map((o) => <button key={o} disabled={pending} onClick={() => run(o, sel)}>{LABEL[o]} المحدد</button>)}
          {pending && <small>جارٍ التنفيذ...</small>}
        </div>
      )}
      {msg && <div className="pn" style={{ borderColor: msg.ok ? '#17724a' : '#b52a2a', margin: '8px 0' }}>{msg.ok ? '✅' : '⚠️'} {msg.t}</div>}
      {rows.map((r) => (
        <div key={r.id} className="pn" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 8, outline: sel.includes(r.id) ? '2px solid #d4af37' : 'none' }}>
          <input type="checkbox" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} style={{ marginTop: 6 }} />
          <div style={{ flex: 1, minWidth: 0 }}>{r.node}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(r.ops ?? ops).map((o) => <button key={o} disabled={pending} onClick={() => run(o, [r.id])} className="sm">{LABEL[o]}</button>)}
          </div>
        </div>
      ))}
      {!rows.length && <p style={{ opacity: .6 }}>{empty ?? 'لا توجد عناصر.'}</p>}
    </div>
  )
}
