-- المراحل 15-22: مستندات، مالية، دفع، إيصالات، استرداد
insert into storage.buckets (id, name, public) values ('case-docs','case-docs', false) on conflict do nothing;
-- لا سياسات على storage.objects = لا وصول إلا عبر service role من السيرفر

create table documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  name text not null, path text not null unique, mime text, size bigint,
  client_visible boolean not null default false,
  archived boolean not null default false,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  case_id uuid references cases(id),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EGP',
  method text,
  status text not null default 'pending' check (status in ('pending','success','failed','cancelled','refunded')),
  provider_ref text unique,             -- Transaction ID من مزود الدفع (يمنع التكرار)
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create table receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no bigserial unique,
  payment_id uuid unique not null references payments(id),
  issued_at timestamptz not null default now()
);
create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  amount numeric(12,2) not null, reason text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create table expenses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id), amount numeric(12,2) not null, note text,
  created_at timestamptz not null default now()
);
alter table documents enable row level security;
alter table payments enable row level security;
alter table receipts enable row level security;
alter table refunds enable row level security;
alter table expenses enable row level security;

create policy dc_read on documents for select using (
  not archived and (is_owner() or is_lawyer_on_case(case_id)
   or (client_visible and exists (select 1 from cases c join clients k on k.id = c.client_id where c.id = documents.case_id and k.profile_id = auth.uid()))));
create policy dc_owner on documents for all using (is_owner()) with check (is_owner());
-- المالية: المالك كله، العميل مدفوعاته فقط، المحامي لا شيء
create policy pm_read on payments for select using (is_owner() or exists (select 1 from clients k where k.id = payments.client_id and k.profile_id = auth.uid()));
create policy rc_read on receipts for select using (is_owner() or exists (select 1 from payments p join clients k on k.id = p.client_id where p.id = receipts.payment_id and k.profile_id = auth.uid()));
create policy rf_owner on refunds for select using (is_owner());
create policy ex_owner on expenses for all using (is_owner()) with check (is_owner());
-- لا insert/update على payments من العميل: تتم من السيرفر فقط
