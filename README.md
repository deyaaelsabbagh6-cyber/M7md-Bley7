# مكتب بليح — المراحل 07–09

1. `npx create-next-app@latest baleeh --ts --app` ثم انسخ هذه الملفات فوقه.
2. `npm i @supabase/ssr @supabase/supabase-js pdf-lib`
3. انسخ `.env.example` إلى `.env.local` واملأه.
4. نفّذ baleeh_schema.sql ثم phase2.sql ثم phase3.sql ثم phase4.sql ثم phase5.sql ثم phase6.sql ثم phase7.sql في Supabase.
5. `npm run dev` ثم افتح `/login`.

ملاحظات: الدخول بالبريد + كلمة المرور (اجعل اسم المستخدم بريدًا داخليًا إن أردت).
المحامون والعملاء تنشئهم من لوحة المالك لاحقًا (المرحلة 10) أو من Supabase مؤقتًا ثم تغيّر `role` في جدول profiles.

## اسم مستخدم المالك
بعد تنفيذ phase5.sql نفّذ: update profiles set username='اسم-مالك-بالانجليزي' where role='owner';
