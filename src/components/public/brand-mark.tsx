import fs from "fs";
import path from "path";
import { cn } from "@/lib/utils";

function logoFile(name: string) {
  return path.join(process.cwd(), "public", "logos", name);
}

export function BrandMark({
  logo = "majestic",
  className,
}: {
  logo?: "majestic" | "closer";
  className?: string;
}) {
  const file =
    logo === "closer" ? "permit_closer_logo.png" : "majestic_permits_logo.png";
  const src = `/logos/${file}`;
  const exists = fs.existsSync(logoFile(file));

  if (exists) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={logo === "closer" ? "The Permit Closer" : "Majestic Permits"}
        className={cn("h-9 w-auto", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground",
        className
      )}
      aria-hidden
    >
      M
    </span>
  );
}
