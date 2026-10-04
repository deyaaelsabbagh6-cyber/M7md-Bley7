-- مالية المحامين (للمالك فقط)
create table lawyer_finance (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references lawyers(id),
  kind text not null check (kind in ('fee','advance','deduction','payout')),
  amount numeric(12,2) not null check (amount > 0), note text,
  created_at timestamptz not null default now()
);
alter table lawyer_finance enable row level security;
create policy lf_owner on lawyer_finance for all using (is_owner()) with check (is_owner());
-- السماح بقراءة عامة لأسماء المحامين المعروضين علنًا
create policy p_public_lawyers on profiles for select using (exists (select 1 from lawyers l where l.id = profiles.id and l.show_public));
