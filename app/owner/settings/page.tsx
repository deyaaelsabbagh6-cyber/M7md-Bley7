import { requireRole } from '@/lib/role'
import SettingsView from '@/app/components/SettingsView'
export default async function P({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams; const { sb, user, name } = await requireRole('owner')
  const { data: p } = await sb.from('profiles').select('username').eq('id', user.id).single()
  return <SettingsView username={p?.username ?? ''} name={name} role="owner" ok={!!ok} />
}
