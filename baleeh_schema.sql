-- مكتب بليح — المرحلة 08: أساس قاعدة البيانات (Supabase / PostgreSQL)
-- شغّله في Supabase > SQL Editor

create type user_role as enum ('owner','lawyer','client');
create type case_status as enum ('open','pending','closed','archived');

-- الملفات الشخصية مرتبطة بحسابات Supabase Auth (كلمات المرور تُدار وتُشفَّر بواسطة Auth فقط)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null, address text, phone text, map_url text,
  is_public boolean not null default true
);

create table specialties (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null, name_en text
);

create table lawyers (
  id uuid primary key references profiles(id) on delete cascade,
  employee_id text unique,
  specialty_id uuid references specialties(id),
  branch_id uuid references branches(id),
  bio text,
  show_public boolean not null default false,
  permissions jsonb not null default '{}'
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,
  full_name text not null, phone text,
  governorate text, district text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table cases (
  id uuid primary key default gen_random_uuid(),
  case_number text unique not null,
  case_type text, court text, district text, governorate text,
  client_id uuid not null references clients(id),
  lead_lawyer_id uuid references lawyers(id),
  status case_status not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

create table case_lawyers (
  case_id uuid references cases(id) on delete cascade,
  lawyer_id uuid references lawyers(id) on delete cascade,
  primary key (case_id, lawyer_id)
);

-- طلبات الاستشارة: الزائر يكتب فقط، والمالك يقرأ
create table consultation_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, phone text not null,
  case_type text, description text,
  governorate text, district text, court text, notes text,
  status text not null default 'new',
  assigned_lawyer_id uuid references lawyers(id),
  created_at timestamptz not null default now()
);

create table audit_logs (
  id bigserial primary key,
  actor_id uuid, action text not null,
  entity text, entity_id text, meta jsonb,   -- ممنوع وضع كلمات مرور هنا
  ip inet, user_agent text,
  created_at timestamptz not null default now()
);

create table security_events (
  id bigserial primary key,
  user_id uuid, event text not null,          -- FAILED_LOGIN / PASSWORD_CHANGE ...
  ip inet, user_agent text,
  created_at timestamptz not null default now()
);

-- دوال مساعدة (security definer لتفادي تكرار RLS)
create function current_role_of() returns user_role
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and is_active $$;

create function is_owner() returns boolean
language sql stable as $$ select coalesce(current_role_of() = 'owner', false) $$;

create function is_lawyer_on_case(c uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from cases x where x.id = c and x.lead_lawyer_id = auth.uid())
   or exists (select 1 from case_lawyers cl where cl.case_id = c and cl.lawyer_id = auth.uid()) $$;

-- تفعيل RLS على كل الجداول
alter table profiles enable row level security;
alter table branches enable row level security;
alter table specialties enable row level security;
alter table lawyers enable row level security;
alter table clients enable row level security;
alter table cases enable row level security;
alter table case_lawyers enable row level security;
alter table consultation_requests enable row level security;
alter table audit_logs enable row level security;
alter table security_events enable row level security;

-- profiles
create policy p_self on profiles for select using (id = auth.uid() or is_owner());
create policy p_owner_all on profiles for all using (is_owner()) with check (is_owner());

-- بيانات عامة
create policy br_public on branches for select using (is_public or is_owner());
create policy br_owner on branches for all using (is_owner()) with check (is_owner());
create policy sp_public on specialties for select using (true);
create policy sp_owner on specialties for all using (is_owner()) with check (is_owner());
create policy lw_public on lawyers for select using (show_public or id = auth.uid() or is_owner());
create policy lw_owner on lawyers for all using (is_owner()) with check (is_owner());

-- العملاء: المالك الكل، المحامي عملاء قضاياه، العميل نفسه فقط
create policy cl_read on clients for select using (
  is_owner() or profile_id = auth.uid()
  or exists (select 1 from cases c where c.client_id = clients.id and is_lawyer_on_case(c.id)));
create policy cl_owner on clients for all using (is_owner()) with check (is_owner());

-- القضايا
create policy cs_read on cases for select using (
  is_owner() or is_lawyer_on_case(id)
  or exists (select 1 from clients k where k.id = cases.client_id and k.profile_id = auth.uid()));
create policy cs_owner on cases for all using (is_owner()) with check (is_owner());
create policy cl2_read on case_lawyers for select using (is_owner() or lawyer_id = auth.uid());
create policy cl2_owner on case_lawyers for all using (is_owner()) with check (is_owner());

-- طلبات الاستشارة: إدخال للزائر، قراءة للمالك
create policy cr_insert on consultation_requests for insert to anon, authenticated with check (status = 'new');
create policy cr_owner on consultation_requests for select using (is_owner());
create policy cr_owner_upd on consultation_requests for update using (is_owner());

-- السجلات: المالك يقرأ فقط، والكتابة من السيرفر (service role) فقط
create policy al_owner on audit_logs for select using (is_owner());
create policy se_owner on security_events for select using (is_owner());

-- إنشاء ملف شخصي تلقائي عند إنشاء حساب (دائمًا client؛ الترقية للمالك يدويًا)
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- بعد إنشاء حسابك من Authentication > Users، اجعله مالكًا:
-- update profiles set role = 'owner', full_name = 'اسمك' where id = '<your-user-uuid>';
