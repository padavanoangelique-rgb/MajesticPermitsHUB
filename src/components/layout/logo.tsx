import Image from "next/image";

export function Logo({
  size = 36,
  showWordmark = true,
  subtitle,
}: {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
}) {
  return (
    <span className="flex items-center gap-3">
      <Image
        src="/icons/icon-512.png"
        alt="Majestic Permits"
        width={size}
        height={size}
        priority
        className="rounded-lg"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-[#0B1F3F] dark:text-white">
            Majestic Permits
          </span>
          {subtitle && (
            <span className="text-xs font-medium text-[#C9A24B]">{subtitle}</span>
          )}
        </span>
      )}
    </span>
  );
}
