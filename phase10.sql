-- يعيد تحميل مخطط قاعدة البيانات في واجهة Supabase بعد إضافة الأعمدة
notify pgrst, 'reload schema';
