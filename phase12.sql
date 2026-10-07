-- الانصراف التلقائي عند مغادرة الموقع: آخر ظهور + لحظة المغادرة
alter table attendance add column if not exists last_seen timestamptz;
alter table attendance add column if not exists left_at timestamptz;
