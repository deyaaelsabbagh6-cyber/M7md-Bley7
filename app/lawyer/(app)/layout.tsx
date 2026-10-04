import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/role'
import Shell from '@/app/components/Shell'

const NAV: [string, string, string][] = [
  ['/lawyer', 'الرئيسية', '🏠'], ['/lawyer/clients', 'عملائي', '👤'], ['/lawyer/cases', 'قضاياي', '⚖️'], ['/lawyer/requests', 'الطلبات', '📨'],
  ['/scan', 'تصوير المستندات', '📷'], ['/lawyer/notifications', 'الإشعارات', '🔔'], ['/lawyer/settings', 'الإعدادات', '⚙️'],
]
// لا دخول لأي صفحة عمل قبل تسجيل الحضور
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { sb, user, name } = await requireRole('lawyer')
  const { data: open } = await sb.from('attendance').select('id').eq('lawyer_id', user.id).is('check_out', null).limit(1)
  if (!open?.length) redirect('/lawyer/checkin')
  return <Shell role="lawyer" nav={NAV} name={name || 'المحامي'}>{children}</Shell>
}
