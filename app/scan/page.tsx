'use client'
import { useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'
import { prepareUpload, finalizeUpload } from '../actions-docs'

type Pg = { url: string; rot: number; br: number; ct: number }
export default function Scan() {
  const v = useRef<HTMLVideoElement>(null)
  const [pages, setPages] = useState<Pg[]>([])
  const q = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null
  const clientId = q?.get('client') ?? '', caseId = q?.get('case') ?? ''
  const [msg, setMsg] = useState('')

  async function start() {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    v.current!.srcObject = s; await v.current!.play()
  }
  function snap() {
    const el = v.current!, c = document.createElement('canvas')
    c.width = el.videoWidth; c.height = el.videoHeight; c.getContext('2d')!.drawImage(el, 0, 0)
    setPages((p) => [...p, { url: c.toDataURL('image/jpeg', .9), rot: 0, br: 100, ct: 110 }])
  }
  const upd = (i: number, k: Partial<Pg>) => setPages((p) => p.map((x, j) => (j === i ? { ...x, ...k } : x)))
  const move = (i: number, d: number) => setPages((p) => { const a = [...p], j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a })

  // يطبّق الدوران والسطوع والتباين على الصورة ثم يُرجع JPEG bytes
  async function render(pg: Pg) {
    const img = new Image(); img.src = pg.url; await img.decode()
    const swap = pg.rot % 180 !== 0, c = document.createElement('canvas')
    c.width = swap ? img.height : img.width; c.height = swap ? img.width : img.height
    const x = c.getContext('2d')!; x.filter = `brightness(${pg.br}%) contrast(${pg.ct}%)`
    x.translate(c.width / 2, c.height / 2); x.rotate((pg.rot * Math.PI) / 180); x.drawImage(img, -img.width / 2, -img.height / 2)
    return new Uint8Array(await (await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', .85))).arrayBuffer())
  }
  async function makePdf() {
    if (!clientId || !pages.length) return setMsg('افتح الماسح من صفحة العميل أو القضية، وصوّر صفحة على الأقل')
    setMsg('جارٍ إنشاء PDF...')
    try {
      const pdf = await PDFDocument.create()
      for (const pg of pages) {
        const im = await pdf.embedJpg(await render(pg)); const p = pdf.addPage([im.width, im.height]); p.drawImage(im, { x: 0, y: 0, width: im.width, height: im.height })
      }
      const bytes = await pdf.save(); const name = `scan-${Date.now()}.pdf`
      const file = new File([bytes as BlobPart], name, { type: 'application/pdf' })
      const { path, token } = await prepareUpload({ clientId, caseId: caseId || null, name, type: file.type, size: file.size })
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
      const { error } = await sb.storage.from('case-docs').uploadToSignedUrl(path, token, file, { contentType: file.type })
      if (error) throw new Error(error.message)
      await finalizeUpload({ clientId, caseId: caseId || null, path, name, type: file.type, size: file.size })
      setMsg('✅ تم إنشاء PDF وربطه بالملف'); setPages([])
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }
  return (
    <main dir="rtl" style={{ padding: 16, background: '#070605', color: '#f4ecd8', minHeight: '100vh' }}>
      <h1 style={{ color: '#f3d98b' }}>📷 ماسح المستندات</h1>
      <input placeholder="معرّف القضية (UUID)" value={caseId} onChange={(e) => setCaseId(e.target.value)} style={{ width: '100%' }} />
      <video ref={v} playsInline muted style={{ width: '100%', borderRadius: 12, marginTop: 8 }} />
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}><button onClick={start}>تشغيل الكاميرا</button><button onClick={snap}>التقاط</button><button onClick={makePdf}>إنشاء PDF ورفعه</button></div>
      <p>{msg}</p>
      {pages.map((p, i) => (
        <div key={i} style={{ border: '1px solid #d4af3788', borderRadius: 12, padding: 8, marginTop: 8 }}>
          <img src={p.url} alt="" style={{ width: 120, transform: `rotate(${p.rot}deg)`, filter: `brightness(${p.br}%) contrast(${p.ct}%)` }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => upd(i, { rot: (p.rot + 90) % 360 })}>↻</button>
            <button onClick={() => move(i, -1)}>↑</button><button onClick={() => move(i, 1)}>↓</button>
            <button onClick={() => setPages((a) => a.filter((_, j) => j !== i))}>🗑 إعادة التصوير</button>
            <label>سطوع <input type="range" min={60} max={160} value={p.br} onChange={(e) => upd(i, { br: +e.target.value })} /></label>
            <label>تباين <input type="range" min={60} max={180} value={p.ct} onChange={(e) => upd(i, { ct: +e.target.value })} /></label>
          </div>
        </div>
      ))}
    </main>
  )
}
