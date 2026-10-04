import { requireRole } from '@/lib/role'
import CaseFile from '@/app/components/CaseFile'
export default async function P({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const { sb } = await requireRole('lawyer'); return <CaseFile sb={sb} id={id} base="/lawyer" /> }
