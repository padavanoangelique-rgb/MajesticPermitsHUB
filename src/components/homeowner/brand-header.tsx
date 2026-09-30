import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandMark } from "@/components/public/brand-mark";

export function BrandHeader({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight text-primary">
            {brand}
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
