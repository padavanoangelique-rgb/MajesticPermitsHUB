import fs from "fs";
import path from "path";
import { WORK_ITEMS } from "@/lib/public-work";

export function WorkGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {WORK_ITEMS.map((item) => {
        const abs = path.join(process.cwd(), "public", "work", item.file);
        const ready = fs.existsSync(abs);
        return (
          <figure
            key={item.file}
            className="overflow-hidden rounded-3xl border border-border bg-card"
          >
            {ready ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/work/${item.file}`} alt={item.alt} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div
                role="img"
                aria-label={item.alt}
                className="flex aspect-[4/3] flex-col items-start justify-end bg-secondary p-5"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Photo coming
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{item.file}</p>
              </div>
            )}
            <figcaption className="px-5 py-4 text-sm font-medium text-foreground">
              {item.label}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
