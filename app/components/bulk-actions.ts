'use server'
import { revalidatePath } from 'next/cache'
import { serverClient, adminClient } from '@/lib/supabase'

type Res = { ok: boolean; msg: string }
const count = async (admin: any, t: string, col: string, id: string) => (await admin.from(t).select('*', { count: 'exact', head: true }).eq(col, id)).count ?? 0

async function removeFiles(admin: any, paths: string[]) { if (paths.length) await admin.storage.from('case-docs').remove(paths) }

// المالك الأساسي = أقدم مالك مفعّل
async function primaryId(admin: any) {
  const { data } = await admin.from('profiles').select('id').eq('role', 'owner').eq('is_active', true).order('created_at', { ascending: true }).limit(1).maybeSingle()
  return data?.id as string | undefined
}

// العملية على عنصر واحد: تُرجع null عند النجاح أو سبب الرفض
async function one(admin: any, entity: string, op: string, id: string, me: string): Promise<string | null> {
  switch (entity) {
    case 'lawyers': {
      if (op === 'disable' || op === 'enable') {
        const on = op === 'enable'
        await admin.from('profiles').update(on ? { is_active: true } : { is_active: false, force_logout_at: new Date().toISOString() }).eq('id', id).eq('role', 'lawyer')
        await admin.auth.admin.updateUserById(id, { ban_duration: on ? 'none' : '876000h' }); return null
      }
      if (op === 'delete') {
        const deps = (await Promise.all([count(admin, 'cases', 'lead_lawyer_id', id), count(admin, 'attendance', 'lawyer_id', id), count(admin, 'assignments', 'lawyer_id', id), count(admin, 'lawyer_finance', 'lawyer_id', id), count(admin, 'tasks', 'lawyer_id', id)])).reduce((a, b) => a + b, 0)
        if (deps) return 'له بيانات مرتبطة (قضايا/حضور/مالية) — عطّله بدل الحذف'
        const { error } = await admin.auth.admin.deleteUser(id); return error ? error.message : null
      }
      break
    }
    case 'clients': {
      if (op === 'disable' || op === 'restore') { await admin.from('clients').update({ archived: op === 'disable' }).eq('id', id); return null }
      if (op === 'delete') {
        const deps = (await Promise.all([count(admin, 'cases', 'client_id', id), count(admin, 'payments', 'client_id', id), count(admin, 'fees', 'client_id', id)])).reduce((a, b) => a + b, 0)
        if (deps) return 'له قضايا أو حسابات — عطّله (أرشفة) بدل الحذف'
        const { data: docs } = await admin.from('documents').select('path').eq('client_id', id)
        const { error } = await admin.from('clients').delete().eq('id', id)
        if (error) return error.message
        await removeFiles(admin, (docs ?? []).map((d: any) => d.path)); return null
      }
      break
    }
    case 'cases': {
      if (op === 'disable' || op === 'restore') { await admin.from('cases').update({ status: op === 'disable' ? 'archived' : 'open' }).eq('id', id); return null }
      if (op === 'delete') {
        const deps = (await Promise.all([count(admin, 'payments', 'case_id', id), count(admin, 'fees', 'case_id', id), count(admin, 'expenses', 'case_id', id)])).reduce((a, b) => a + b, 0)
        if (deps) return 'عليها مدفوعات أو أتعاب أو مصروفات — أرشفها بدل الحذف'
        const { data: docs } = await admin.from('documents').select('path').eq('case_id', id)
        const { error } = await admin.from('cases').delete().eq('id', id)
        if (error) return error.message
        await removeFiles(admin, (docs ?? []).map((d: any) => d.path)); return null
      }
      break
    }
    case 'documents': {
      if (op === 'disable' || op === 'restore') { await admin.from('documents').update({ archived: op === 'disable' }).eq('id', id); return null }
      if (op === 'delete') {
        const { data: d } = await admin.from('documents').select('path').eq('id', id).maybeSingle()
        const { error } = await admin.from('documents').delete().eq('id', id)
        if (error) return error.message
        if (d?.path) await removeFiles(admin, [d.path]); return null
      }
      break
    }
    case 'hearings': case 'tasks': case 'fees': case 'expenses': case 'lawyer_finance': {
      if (op !== 'delete') break
      const { error } = await admin.from(entity).delete().eq('id', id); return error ? error.message : null
    }
    case 'owners': {
      const prim = await primaryId(admin)
      if (id === me) return 'لا يمكنك تنفيذ ذلك على حسابك'
      if (id === prim) return 'لا يمكن المساس بالمالك الأساسي'
      if (op === 'enable' && me !== prim) return 'اعتماد المالك من صلاحية المالك الأساسي فقط'
      if (op === 'disable' || op === 'enable') {
        const on = op === 'enable'
        await admin.from('profiles').update(on ? { is_active: true } : { is_active: false, force_logout_at: new Date().toISOString() }).eq('id', id).eq('role', 'owner')
        await admin.auth.admin.updateUserById(id, { ban_duration: on ? 'none' : '876000h' }); return null
      }
      if (op === 'delete') {
        const { data: p } = await admin.from('profiles').select('is_active').eq('id', id).eq('role', 'owner').maybeSingle()
        if (p?.is_active) return 'عطّل الحساب أولًا ثم احذفه'
        const { error } = await admin.auth.admin.deleteUser(id); return error ? error.message : null
      }
      break
    }
  }
  return 'عملية غير مدعومة'
}

export async function bulkApply(entity: string, op: string, ids: string[]): Promise<Res> {
  try {
    if (!ids?.length) return { ok: false, msg: 'لم تحدد أي عنصر' }
    const sb = await serverClient()
    const { data: { user } } = await sb.auth.getUser(); if (!user) return { ok: false, msg: 'سجّل الدخول من جديد' }
    const { data: p } = await sb.from('profiles').select('role,is_active').eq('id', user.id).single()
    if (!p?.is_active) return { ok: false, msg: 'الحساب غير مفعّل' }
    const admin = adminClient()
    // الإشعارات: كل مستخدم يتعامل مع إشعاراته فقط
    if (entity === 'notifications') {
      const q = op === 'delete' ? admin.from('notifications').delete() : admin.from('notifications').update({ read: true })
      await q.in('id', ids).eq('user_id', user.id)
    } else {
      if (p.role !== 'owner') return { ok: false, msg: 'هذه العملية للمالك فقط' }
      const fails: string[] = []; let done = 0
      for (const id of ids) { const r = await one(admin, entity, op, id, user.id); if (r) fails.push(r); else done++ }
      await admin.from('audit_logs').insert({ actor_id: user.id, action: `BULK_${op.toUpperCase()}`, entity, meta: { count: done, failed: fails.length } })
      revalidatePath('/owner', 'layout'); revalidatePath('/lawyer', 'layout')
      if (fails.length) return { ok: done > 0, msg: `تم ${done} — تعذّر ${fails.length}: ${[...new Set(fails)][0]}` }
      return { ok: true, msg: `تم تنفيذ العملية على ${done} عنصر` }
    }
    revalidatePath('/owner', 'layout'); revalidatePath('/lawyer', 'layout')
    return { ok: true, msg: 'تم' }
  } catch (e: any) { return { ok: false, msg: e?.message ?? 'حدث خطأ' } }
}
