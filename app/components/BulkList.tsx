'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bulkApply } from './bulk-actions'
import { updateRecord } from './edit-actions'

const LABEL: Record<string, string> = { disable: '🚫 تعطيل', enable: '✅ تفعيل', delete: '🗑 حذف', restore: '↩️ استرجاع', read: '✔️ مقروء' }
const ASK: Record<string, string> = { disable: 'تعطيل', enable: 'تفعيل', delete: 'حذف نهائي', restore: 'استرجاع', read: 'تعليم كمقروء' }
export type EditField = { name: string; label: string; value: string; type?: 'text' | 'number' | 'datetime-local' | 'textarea' }
type Row = { id: string; node: React.ReactNode; ops?: string[]; edit?: EditField[] }

// قائمة بتحديد متعدد + تعديل وحذف وتعطيل لكل عنصر
export default function BulkList({ entity, ops, rows, empty }: { entity: string; ops: string[]; rows: Row[]; empty?: string }) {
  const [sel, setSel] = useState<string[]>([]), [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null), [pending, start] = useTransition(), [editing, setEditing] = useState<string | null>(null), router = useRouter()
  const all = rows.length > 0 && sel.length === rows.length
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  function run(op: string, ids: string[]) {
    if (!ids.length) return setMsg({ ok: false, t: 'حدّد عنصرًا واحدًا على الأقل' })
    if ((op === 'delete' || op === 'disable') && !confirm(`تأكيد ${ASK[op]} لعدد ${ids.length} عنصر؟`)) return
    start(async () => { const r = await bulkApply(entity, op, ids); setMsg({ ok: r.ok, t: r.msg }); setSel([]); router.refresh() })
  }
  function save(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>
    start(async () => { const r = await updateRecord(entity, id, v); setMsg({ ok: r.ok, t: r.msg }); if (r.ok) setEditing(null); router.refresh() })
  }
  return (
    <div>
      {rows.length > 0 && ops.length > 0 && (
        <div className="pn" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '10px 0' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}><input type="checkbox" checked={all} onChange={() => setSel(all ? [] : rows.map((r) => r.id))} /> تحديد الكل ({sel.length})</label>
          {ops.map((o) => <button key={o} disabled={pending} onClick={() => run(o, sel)}>{LABEL[o]} المحدد</button>)}
          {pending && <small>جارٍ التنفيذ...</small>}
        </div>
      )}
      {msg && <div className="pn" style={{ borderColor: msg.ok ? '#17724a' : '#b52a2a', margin: '8px 0' }}>{msg.ok ? '✅' : '⚠️'} {msg.t}</div>}
      {rows.map((r) => (
        <div key={r.id} className="pn" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 10px', alignItems: 'start', marginTop: 8, outline: sel.includes(r.id) ? '2px solid #d4af37' : 'none' }}>
          <input type="checkbox" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} style={{ marginTop: 4 }} />
          <div style={{ minWidth: 0, overflowWrap: 'anywhere', lineHeight: 1.7 }}>{r.node}</div>
          <span />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {r.edit && <button disabled={pending} onClick={() => setEditing(editing === r.id ? null : r.id)} className="sm">✏️ تعديل</button>}
            {(r.ops ?? ops).map((o) => <button key={o} disabled={pending} onClick={() => run(o, [r.id])} className="sm">{LABEL[o]}</button>)}
          </div>
          {r.edit && editing === r.id && (<>
            <span />
            <form onSubmit={(e) => save(e, r.id)} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
              {r.edit.map((f) => (
                <label key={f.name} style={{ display: 'grid', gap: 3 }}><small style={{ opacity: .75 }}>{f.label}</small>
                  {f.type === 'textarea' ? <textarea name={f.name} rows={3} defaultValue={f.value} /> : <input name={f.name} type={f.type ?? 'text'} step={f.type === 'number' ? '0.01' : undefined} defaultValue={f.value} />}
                </label>
              ))}
              <div style={{ display: 'flex', gap: 8 }}><button disabled={pending} className="bp">💾 حفظ التعديل</button><button type="button" onClick={() => setEditing(null)}>إلغاء</button></div>
            </form>
          </>)}
        </div>
      ))}
      {!rows.length && <p style={{ opacity: .6 }}>{empty ?? 'لا توجد عناصر.'}</p>}
    </div>
  )
}
