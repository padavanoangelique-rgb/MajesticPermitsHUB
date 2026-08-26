// Placeholder – will pull from stage history / notes once populated
export function ActivityTimeline({ jobId }: { jobId: string }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-semibold text-navy dark:text-white">
        Recent updates
      </h2>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-8 text-center dark:border-slate-700 dark:bg-surface-dark/50">
        <p className="text-muted-foreground">
          Updates will appear here as the project progresses.
        </p>
      </div>
    </section>
  );
}
