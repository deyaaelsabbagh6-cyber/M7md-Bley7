// إشعار كل المالكين المفعّلين (مثل حضور/انصراف المحامي)
export async function notifyOwners(admin: any, title: string, body?: string) {
  const { data } = await admin.from('profiles').select('id').eq('role', 'owner').eq('is_active', true)
  if (data?.length) await admin.from('notifications').insert(data.map((o: any) => ({ user_id: o.id, title, body: body ?? null })))
}
export const cairoTime = (d = new Date()) => d.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })
