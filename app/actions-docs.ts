'use server'
import { prepareDocUpload, finalizeDocUpload } from '@/lib/docs'
export async function prepareUpload(o: { clientId: string; caseId?: string | null; name: string; type: string; size: number }) { return prepareDocUpload(o) }
export async function finalizeUpload(o: { clientId: string; caseId?: string | null; path: string; name: string; type: string; size: number }) { return finalizeDocUpload(o) }
