import { requireRole } from '@/lib/role'
import Shell from '@/app/components/Shell'

const NAV: [string, string, string][] = [
  ['/owner', 'الرئيسية', '🏠'], ['/owner/lawyers', 'المحامون', '👥'], ['/owner/clients', 'العملاء', '👤'], ['/owner/cases', 'القضايا', '⚖️'],
  ['/owner/documents', 'المستندات', '📁'], ['/owner/accounts', 'الحسابات', '🪙'], ['/owner/attendance', 'الحضور والانصراف', '🕘'],
  ['/owner/notifications', 'الإشعارات', '🔔'], ['/owner/security', 'الأمن', '🛡️'], ['/owner/reports', 'التقارير', '📊'],
  ['/owner/owners', 'حسابات المالك', '👑'], ['/owner/settings', 'الإعدادات', '⚙️'],
]
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { name } = await requireRole('owner')
  return <Shell role="owner" nav={NAV} name={name || 'Owner'}>{children}</Shell>
}
