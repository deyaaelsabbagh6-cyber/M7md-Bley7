'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { prepareUpload, finalizeUpload } from '../actions-docs'

// رفع مستند في صفحة العميل: مباشرة إلى التخزين الخاص ثم تسجيله في قاعدة البيانات
export default function ClientUpload({ clientId, cases, fixedCase }: { clientId: string; cases: { id: string; case_number: string }[]; fixedCase?: string }) {
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), router = useRouter()
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const caseId = fixedCase || (document.getElementById('upcase') as HTMLSelectElement)?.value || null
    setBusy(true); setMsg('جارٍ الرفع...')
    try {
      const { path, token } = await prepareUpload({ clientId, caseId, name: file.name, type: file.type, size: file.size })
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
      const { error } = await sb.storage.from('case-docs').uploadToSignedUrl(path, token, file, { contentType: file.type })
      if (error) throw new Error(error.message)
      await finalizeUpload({ clientId, caseId, path, name: file.name, type: file.type, size: file.size })
      setMsg('✅ تم رفع المستند'); router.refresh()
    } catch (err: any) { setMsg('❌ ' + err.message) }
    setBusy(false); e.target.value = ''
  }
  return (
    <div style={{ display: 'grid', gap: 6, margin: '8px 0' }}>
      {!fixedCase && <select id="upcase"><option value="">مستند عام للعميل (بدون قضية)</option>{cases.map((c) => <option key={c.id} value={c.id}>قضية #{c.case_number}</option>)}</select>}
      <label style={{ border: '1px solid #d4af37', borderRadius: 10, padding: 10, textAlign: 'center', cursor: 'pointer' }}>
        📤 {busy ? '...' : 'رفع مستند (PDF / JPG / PNG)'}<input type="file" accept="application/pdf,image/jpeg,image/png" hidden disabled={busy} onChange={onPick} />
      </label>
      <a href={`/scan?client=${clientId}${fixedCase ? `&case=${fixedCase}` : ''}`} style={{ border: '1px solid #d4af37', borderRadius: 10, padding: 10, textAlign: 'center', color: '#f3d98b' }}>📷 تصوير مستند بالكاميرا وتحويله إلى PDF</a>
      <small>{msg}</small>
    </div>
  )
}
