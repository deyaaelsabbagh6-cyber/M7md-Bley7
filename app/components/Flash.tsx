'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
function Inner() {
  const sp = useSearchParams(), e = sp.get('err'), ok = sp.get('ok')
  if (e) return <div className="pn" style={{ borderColor: '#b52a2a', color: '#ff9a8a', marginBottom: 10 }}>⚠️ {e}</div>
  if (ok) return <div className="pn" style={{ borderColor: '#17724a', color: '#7fe0a8', marginBottom: 10 }}>✅ {ok}</div>
  return null
}
export default function Flash() { return <Suspense><Inner /></Suspense> }
