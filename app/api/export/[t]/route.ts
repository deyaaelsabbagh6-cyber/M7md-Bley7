import { NextResponse } from 'next/server'
import { serverClient, adminClient } from '@/lib/supabase'
const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
const one = (x: any) => (Array.isArray(x) ? x[0] : x)

// تصدير CSV للمالك فقط (يُفتح مباشرة في Excel)
export async function GET(_: Request, { params }: { params: Promise<{ t: string }> }) {
  const { t } = await params
  const sb = await serverClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return new NextResponse('unauthorized', { status: 401 })
  const { data: p } = await sb.from('profiles').select('role,is_active').eq('id', user.id).single()
  if (!p?.is_active || p.role !== 'owner') return new NextResponse('forbidden', { status: 403 })
  let head: string[] = [], rows: unknown[][] = []
  if (t === 'lawyers') {
    const { data } = await sb.from('lawyers').select('employee_id,specialty,profiles(full_name,phone,username,is_active)').eq('archived', false)
    head = ['الاسم', 'اسم المستخدم', 'الرقم الوظيفي', 'التخصص', 'الهاتف', 'الحالة']
    rows = (data ?? []).map((l: any) => { const q = one(l.profiles); return [q?.full_name, q?.username, l.employee_id, l.specialty, q?.phone, q?.is_active ? 'مفعل' : 'معطل'] })
  } else if (t === 'clients') {
    const { data } = await sb.from('clients').select('full_name,phone,governorate,district,created_at').eq('archived', false)
    head = ['الاسم', 'الهاتف', 'المحافظة', 'المركز', 'تاريخ الإضافة']
    rows = (data ?? []).map((c) => [c.full_name, c.phone, c.governorate, c.district, c.created_at])
  } else if (t === 'cases') {
    const { data } = await sb.from('cases').select('case_number,case_type,court,governorate,district,status,created_at,clients(full_name)')
    head = ['رقم القضية', 'النوع', 'المحكمة', 'المحافظة', 'المركز', 'الحالة', 'العميل', 'تاريخ الإنشاء']
    rows = (data ?? []).map((c: any) => [c.case_number, c.case_type, c.court, c.governorate, c.district, c.status, one(c.clients)?.full_name, c.created_at])
  } else if (t === 'payments') {
    const { data } = await sb.from('payments').select('amount,currency,method,status,created_at,clients(full_name)')
    head = ['العميل', 'المبلغ', 'العملة', 'الطريقة', 'الحالة', 'التاريخ']
    rows = (data ?? []).map((x: any) => [one(x.clients)?.full_name, x.amount, x.currency, x.method, x.status, x.created_at])
  } else return new NextResponse('not found', { status: 404 })
  await adminClient().from('audit_logs').insert({ actor_id: user.id, action: 'EXPORT', entity: t })
  const csv = '\ufeff' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${t}.csv"` } })
}
