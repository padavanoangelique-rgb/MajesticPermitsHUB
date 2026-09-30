import fs from "fs";
import path from "path";
import { WORK_ITEMS } from "@/lib/public-work";

const PLACEMENTS = [
  "sm:col-span-5 sm:col-start-1",
  "sm:col-span-4 sm:col-start-8 sm:mt-20",
  "sm:col-span-4 sm:col-start-2 sm:mt-6",
  "sm:col-span-5 sm:col-start-8 sm:-mt-6",
  "sm:col-span-4 sm:col-start-1 sm:mt-10",
  "sm:col-span-4 sm:col-start-7 sm:mt-16",
];

export function WorkGrid() {
  return (
    <div className="grid grid-cols-1 gap-y-16 sm:grid-cols-12 sm:gap-x-8 sm:gap-y-14">
      {WORK_ITEMS.map((item, index) => {
        const abs = path.join(process.cwd(), "public", "work", item.file);
        const ready = fs.existsSync(abs);
        const shift = index % 2 === 0 ? "mr-10" : "ml-10";
        return (
          <figure
            key={item.file}
            className={`overflow-hidden rounded-3xl border border-border bg-card ${shift} sm:mx-0 ${PLACEMENTS[index] || ""}`}
          >
            {ready ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/work/${item.file}`} alt={item.alt} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div
                role="img"
                aria-label={item.alt}
                className="flex aspect-[4/3] flex-col items-start justify-end bg-background p-5"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Photo coming
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{item.file}</p>
              </div>
            )}
            <figcaption className="bg-card px-5 py-4 text-sm font-medium text-foreground">
              {item.label}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
