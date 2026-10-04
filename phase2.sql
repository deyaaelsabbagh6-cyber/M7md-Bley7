-- المراحل 11-18: حضور، جلسات، مهام، إشعارات
create table attendance (
  id bigserial primary key,
  lawyer_id uuid not null references lawyers(id),
  check_in timestamptz not null default now(),   -- وقت السيرفر
  check_out timestamptz,
  user_agent text
);
create table hearings (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  hearing_at timestamptz not null, court text, notes text
);
create table tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  lawyer_id uuid references lawyers(id),
  title text not null, due_at timestamptz, done boolean not null default false
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null, body text, read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table attendance enable row level security;
alter table hearings enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;

create policy at_read on attendance for select using (is_owner() or lawyer_id = auth.uid());
create policy hr_read on hearings for select using (
  is_owner() or is_lawyer_on_case(case_id)
  or exists (select 1 from cases c join clients k on k.id = c.client_id where c.id = hearings.case_id and k.profile_id = auth.uid()));
create policy hr_owner on hearings for all using (is_owner()) with check (is_owner());
create policy tk_read on tasks for select using (is_owner() or lawyer_id = auth.uid());
create policy tk_upd on tasks for update using (lawyer_id = auth.uid()) with check (lawyer_id = auth.uid());
create policy tk_owner on tasks for all using (is_owner()) with check (is_owner());
create policy nt_own on notifications for select using (user_id = auth.uid());
create policy nt_upd on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
