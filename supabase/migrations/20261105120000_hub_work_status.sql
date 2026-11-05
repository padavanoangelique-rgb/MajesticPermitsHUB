-- The inspection status bar. jobs.stage stays the permit's own status (and is kept in step for the older pages);
-- jobs.work_status is where the work is, from "install ready to start" to "permit closed". Additive and safe to rerun.

alter table jobs add column if not exists work_status text;

-- Jobs already past approval get the status their stage implies.
update jobs set work_status = case stage
  when 'Approved — ready to build' then 'install_ready'
  when 'Install scheduled' then 'install_ready'
  when 'Being installed' then 'install_started'
  when 'Inspection scheduled' then 'needs_inspection_progress'
  when 'Inspections in progress' then 'needs_inspection_progress'
  when 'Ready for final' then 'needs_final'
  when 'Final inspection passed' then 'final_passed'
  when 'Permit closed — all done' then 'permit_closed'
  else work_status end
where work_status is null;
