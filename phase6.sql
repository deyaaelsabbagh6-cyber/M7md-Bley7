-- إلغاء استقبال طلبات الزوار (الموقع للمالك والمحامين فقط)
drop policy if exists cr_insert on consultation_requests;
