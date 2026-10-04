-- مستندات وحسابات لكل عميل + إزالة الدفع بالبطاقات والمحافظ
alter table documents alter column case_id drop not null;
alter table documents add column if not exists client_id uuid references clients(id) on delete cascade;
update documents d set client_id = c.client_id from cases c where c.id = d.case_id and d.client_id is null;
alter table documents add constraint documents_target_chk check (case_id is not null or client_id is not null);

create table if not exists fees (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  case_id uuid references cases(id),
  amount numeric(12,2) not null check (amount > 0), note text,
  created_at timestamptz not null default now()
);
alter table fees enable row level security;
create policy fees_owner on fees for all using (is_owner()) with check (is_owner());

drop policy if exists dc_read on documents;
create policy dc_read on documents for select using (
  not archived and (is_owner()
    or (case_id is not null and is_lawyer_on_case(case_id))
    or exists (select 1 from cases c where c.client_id = documents.client_id and is_lawyer_on_case(c.id))));

update payments set method = 'cash' where method in ('card','wallet');
alter table payments add constraint payments_method_chk check (method is null or method in ('cash','transfer'));

alter table attendance add column if not exists auto_closed boolean not null default false;
