import { NextResponse } from 'next/server'
import { saveDocument } from '@/lib/docs'
export async function POST(req: Request) {
  try {
    const f = await req.formData()
    const id = await saveDocument({ caseId: String(f.get('caseId') || '') || null, clientId: String(f.get('clientId') || '') || null, file: f.get('file') as File })
    return NextResponse.json({ id })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }) }
}
