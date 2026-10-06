-- إصلاح: سياستان كانتا تستدعيان بعضهما (العملاء <-> القضايا) فكانت قراءة العملاء والقضايا تفشل
drop policy if exists cs_read on cases;
create policy cs_read on cases for select using (is_owner() or is_lawyer_on_case(id));

drop policy if exists cl_read on clients;
create policy cl_read on clients for select using (
  is_owner()
  or exists (select 1 from cases c where c.client_id = clients.id and is_lawyer_on_case(c.id)));

drop policy if exists hr_read on hearings;
create policy hr_read on hearings for select using (is_owner() or is_lawyer_on_case(case_id));
