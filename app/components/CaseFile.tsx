import { notFound } from 'next/navigation'
const one = (x: any) => (Array.isArray(x) ? x[0] : x)
const box = { border: '1px solid #d4af3788', borderRadius: 14, padding: 14, marginTop: 10, background: '#14110cb8' }
const ST: Record<string, string> = { open: 'قيد المتابعة', pending: 'معلقة', closed: 'مكتملة', archived: 'مؤرشفة' }
const KIND: Record<string, string> = { new_case: 'قضية جديدة', investigation: 'طلب تحريات', memo: 'طلب مذكرة', hearing: 'حضور جلسة', other: 'طلب آخر' }
// ملف القضية (RLS يحدد ما يراه كل مستخدم)
export default async function CaseFile({ sb, id, base, children }: { sb: any; id: string; base: '/owner' | '/lawyer'; children?: React.ReactNode }) {
  const { data: c } = await sb.from('cases').select('id,case_number,title,case_type,court,governorate,district,status,notes,created_at,client_id,clients(id,full_name,phone,file_no,email),lawyers:lead_lawyer_id(profiles(full_name))').eq('id', id).maybeSingle()
  if (!c) notFound()
  const [{ data: hs }, { data: docs }, { data: asg }, { data: part }] = await Promise.all([
    sb.from('hearings').select('id,hearing_at,court').eq('case_id', id).order('hearing_at'),
    sb.from('documents').select('id,name,mime,created_at').eq('case_id', id).eq('archived', false).order('created_at', { ascending: false }),
    sb.from('assignments').select('id,kind,note,status,created_at').eq('case_id', id).order('created_at', { ascending: false }),
    sb.from('case_lawyers').select('lawyers(id,profiles(full_name))').eq('case_id', id),
  ])
  const k = one(c.clients), lead = one(one(c.lawyers)?.profiles)
  return (<>
    <a href={`${base}/cases`} style={{ color: '#f3d98b' }}>← القضايا</a>
    <h1 style={{ color: '#f3d98b' }}>#{c.case_number} — {c.title || c.case_type}</h1>
    <div style={box}>
      <p>الحالة: <b>{ST[c.status] ?? c.status}</b> — المحكمة: {c.court} — {c.governorate} / {c.district}</p>
      <p>العميل: <a href={`${base}/clients/${k?.id}`} style={{ color: '#f3d98b' }}>{k?.full_name}</a> {k?.phone}{k?.file_no ? ` — ملف ${k.file_no}` : ''}{k?.email ? ` — ${k.email}` : ''} — المحامي المسؤول: {lead?.full_name ?? 'لم يُعيَّن'}</p>
      {!!part?.length && <p>المحامون المشاركون: {part.map((x: any) => one(one(x.lawyers)?.profiles)?.full_name).join('، ')}</p>}
      {c.notes && <p>ملاحظات: {c.notes}</p>}
    </div>
    {children}
    <h2>الجلسات</h2>
    {(hs ?? []).map((h: any) => <div key={h.id} style={box}>{new Date(h.hearing_at).toLocaleString('ar-EG')} — {h.court}</div>)}
    {!hs?.length && <p style={{ opacity: .6 }}>لا جلسات.</p>}
    <h2>الطلبات المرسلة للمحامين</h2>
    {(asg ?? []).map((a: any) => <div key={a.id} style={box}>{KIND[a.kind]} — {a.status} {a.note && `— ${a.note}`}</div>)}
    <h2>المستندات</h2>
    {(docs ?? []).map((d: any) => <div key={d.id} style={box}>📄 <a href={`/api/doc/${d.id}`} style={{ color: '#f3d98b' }}>{d.name}</a> <small style={{ opacity: .6 }}>{new Date(d.created_at).toLocaleDateString('ar-EG')}</small></div>)}
    {!docs?.length && <p style={{ opacity: .6 }}>لا مستندات. ارفع من صفحة العميل.</p>}
  </>)
}
