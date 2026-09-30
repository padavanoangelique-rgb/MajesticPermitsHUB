// Placeholder – will pull from stage history / notes once populated
export function ActivityTimeline({ jobId }: { jobId: string }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-semibold text-foreground">
        Recent updates
      </h2>
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center dark:border-border dark:bg-surface-dark/50">
        <p className="text-muted-foreground">
          Updates will appear here as the project progresses.
        </p>
      </div>
    </section>
  );
}
