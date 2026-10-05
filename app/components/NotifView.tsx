import { markAll } from '../notif-actions'
import BulkList from './BulkList'
const KIND = { box: { border: '1px solid #d4af3788', borderRadius: 14, padding: 12, marginTop: 8, background: '#14110cb8' } }
export default async function NotifView({ sb }: { sb: any }) {
  const { data } = await sb.from('notifications').select('id,title,body,read,created_at').order('created_at', { ascending: false }).limit(100)
  return (<>
    <h1 style={{ color: '#f3d98b' }}>🔔 الإشعارات</h1>
    <form action={markAll}><button>تعليم الكل كمقروء</button></form>
    <BulkList entity="notifications" ops={['read', 'delete']} rows={(data ?? []).map((n: any) => ({ id: n.id, ops: n.read ? ['delete'] : ['read', 'delete'], node: (
      <div style={{ opacity: n.read ? .55 : 1 }}><b>{n.title}</b>{n.body && <p style={{ margin: '4px 0' }}>{n.body}</p>}
        <small style={{ opacity: .6 }}>{new Date(n.created_at).toLocaleString('ar-EG')}</small></div>) }))} empty="لا توجد إشعارات." />
  </>)
}
