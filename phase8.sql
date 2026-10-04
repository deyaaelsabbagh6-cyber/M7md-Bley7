-- المرحلة 8: دخول آمن، طلبات للمحامين، أرشفة، إنهاء الجلسات
alter table profiles add column if not exists force_logout_at timestamptz;
alter table lawyers add column if not exists specialty text;
alter table lawyers add column if not exists archived boolean not null default false;

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  lawyer_id uuid not null references lawyers(id),
  kind text not null check (kind in ('new_case','investigation','memo','hearing','other')),
  note text,
  status text not null default 'new' check (status in ('new','accepted','done')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
alter table assignments enable row level security;
drop policy if exists as_owner on assignments;
create policy as_owner on assignments for all using (is_owner()) with check (is_owner());
drop policy if exists as_lawyer on assignments;
create policy as_lawyer on assignments for select using (lawyer_id = auth.uid());

-- أي حساب جديد يُنشأ معطّلًا حتى يفعّله المالك (يمنع التسجيل الذاتي)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, is_active)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), false);
  return new;
end $$;
