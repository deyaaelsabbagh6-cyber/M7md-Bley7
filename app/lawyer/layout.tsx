import { requireRole } from '@/lib/role'
export default async function L({ children }: { children: React.ReactNode }) {
  await requireRole('lawyer')
  return <>{children}</>
}
