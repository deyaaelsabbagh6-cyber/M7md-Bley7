'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
function Inner() { const e = useSearchParams().get('err'); return e ? <div className="pn" style={{ borderColor: '#b52a2a', color: '#ff9a8a', marginBottom: 10 }}>⚠️ {e}</div> : null }
export default function Flash() { return <Suspense><Inner /></Suspense> }
