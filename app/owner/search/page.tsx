import { requireRole } from '@/lib/role'
import SearchView from '@/app/components/SearchView'
export default async function P({ searchParams }: { searchParams: Promise<{ q?: string }> }) { const { q = '' } = await searchParams; const { sb } = await requireRole('owner'); return <SearchView sb={sb} q={q} base="/owner" withLawyers /> }
