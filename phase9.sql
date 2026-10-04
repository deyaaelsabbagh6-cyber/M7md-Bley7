-- تعديل كامل لبيانات القضية والعميل: حقول إضافية
alter table cases add column if not exists title text;
alter table clients add column if not exists file_no text;
alter table clients add column if not exists email text;
alter table clients add column if not exists notes text;
create unique index if not exists clients_file_no_uq on clients (file_no) where file_no is not null;
