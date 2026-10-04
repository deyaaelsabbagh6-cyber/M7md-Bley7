'use client'
import { useState } from 'react'

type C = { id: string; case_number: string; case_type: string | null }
type L = { id: string; name: string; specialty: string | null }
const KINDS: [string, string][] = [['new_case', 'قضية جديدة'], ['investigation', 'طلب تحريات'], ['memo', 'طلب مذكرة'], ['hearing', 'حضور جلسة'], ['other', 'طلب آخر']]

// إرسال قضية/طلب للمحامي: المحامون المتخصصون في نوع القضية يظهرون أولًا بعلامة ★
export default function DispatchForm({ cases, lawyers, action, fixedLawyer }: { cases: C[]; lawyers: L[]; action: (f: FormData) => void; fixedLawyer?: string }) {
  const [type, setType] = useState('')
  const match = (l: L) => !!type && !!l.specialty && (type.includes(l.specialty) || l.specialty.includes(type))
  const sorted = [...lawyers].sort((a, b) => Number(match(b)) - Number(match(a)))
  return (
    <form action={action} style={{ display: 'grid', gap: 6, maxWidth: 420, border: '1px solid #d4af3788', borderRadius: 14, padding: 12, background: '#14110cb8' }}>
      <b>📤 إرسال قضية / طلب لمحامٍ</b>
      <select name="case" required onChange={(e) => setType(cases.find((c) => c.id === e.target.value)?.case_type ?? '')}>
        <option value="">اختر القضية</option>{cases.map((c) => <option key={c.id} value={c.id}>#{c.case_number} — {c.case_type}</option>)}
      </select>
      {fixedLawyer ? <input type="hidden" name="lawyer" value={fixedLawyer} /> : (
        <select name="lawyer" required><option value="">المحامي</option>
          {sorted.map((l) => <option key={l.id} value={l.id}>{match(l) ? '★ ' : ''}{l.name}{l.specialty ? ` (${l.specialty})` : ''}</option>)}
        </select>)}
      <select name="kind">{KINDS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
      <textarea name="note" rows={3} placeholder="المطلوب من المحامي (تفاصيل / ملاحظات)" />
      <button>إرسال وإشعار المحامي</button>
    </form>
  )
}
