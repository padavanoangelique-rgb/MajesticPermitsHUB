-- Preserve every existing status; allow the Hub's request and final-close workflows.
begin;
alter table public.jobs drop constraint if exists jobs_sub_status_check;
alter table public.jobs add constraint jobs_sub_status_check check (
  sub_status = any(array[
    'Need to Submit', 'In Review', 'Approved', 'Approved and Printed', 'Complete',
    'Pending approval', 'Request declined', 'Closed'
  ]::text[])
);
commit;
