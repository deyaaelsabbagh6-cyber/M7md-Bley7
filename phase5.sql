-- اسم مستخدم لكل حساب
alter table profiles add column if not exists username text unique;
