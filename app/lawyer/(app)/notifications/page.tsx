import { requireRole } from '@/lib/role'
import NotifView from '@/app/components/NotifView'
export default async function P() { const { sb } = await requireRole('lawyer'); return <NotifView sb={sb} /> }
