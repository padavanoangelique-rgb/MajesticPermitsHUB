"use client";

import { useState } from "react";

type PickerJob = { id: string; address: string; name: string };

/** Pick the job the photos are for, then open the camera tool with the job filled in. */
export function PhotoJobPicker({ jobs, takenBy }: { jobs: PickerJob[]; takenBy: string }) {
  const [jobId, setJobId] = useState("");
  const job = jobs.find((item) => item.id === jobId);

  function href(chosen?: PickerJob) {
    const query = new URLSearchParams();
    if (chosen) {
      query.set("job", chosen.id);
      query.set("addr", chosen.address);
      if (chosen.name) query.set("name", chosen.name);
    }
    if (takenBy) query.set("by", takenBy);
    return `/dashboard/photo-report.html?${query.toString()}`;
  }

  const box = "min-h-12 rounded-xl border border-border bg-card px-3";
  const button = "inline-flex min-h-12 items-center justify-center rounded-xl px-5 font-semibold";

  return (
    <div className="grid gap-4">
      <label className="grid gap-1 text-sm">
        Which job are the photos for?
        <select className={box} value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">Pick a job</option>
          {jobs.map((item) => (
            <option key={item.id} value={item.id}>
              {item.address}
            </option>
          ))}
        </select>
      </label>
      {job ? (
        <a href={href(job)} className={`${button} bg-primary text-white`}>
          Start the photo report
        </a>
      ) : (
        <span aria-disabled="true" className={`${button} bg-primary/40 text-white/70`}>
          Start the photo report
        </span>
      )}
      <a href={href()} className="text-sm text-violet-300 underline">
        Not tied to a job? Start without one
      </a>
      <p className="text-xs text-muted-foreground">
        The photos stay on your phone until you make the PDF. With a job picked, the PDF can be saved to that job&apos;s documents under inspection documents and photos.
      </p>
    </div>
  );
}
