import Image from "next/image";

export function VehicleImage({ src, alt, isDemo, className = "", priority, zoom = false }: {
  src?: string | null;
  alt: string;
  isDemo?: boolean;
  className?: string;
  priority?: boolean;
  zoom?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className={`object-cover ${zoom ? "transition-transform duration-500 group-hover:scale-[1.04]" : ""}`} priority={priority} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
          <svg width="64" height="32" viewBox="0 0 160 52" aria-hidden="true">
            <path d="M8 34 C10 22 22 20 36 18 L56 6 C62 3 92 2 104 6 L126 18 C140 20 150 24 152 34 L152 40 L8 40 Z" fill="currentColor" opacity="0.35" />
            <circle cx="42" cy="40" r="10" fill="currentColor" opacity="0.5" />
            <circle cx="120" cy="40" r="10" fill="currentColor" opacity="0.5" />
          </svg>
          <span className="text-xs">Photo à venir</span>
        </div>
      )}
      {isDemo && (
        <span className="absolute bottom-3 left-4 rounded-[3px] bg-[#123325cc] px-2 py-1 text-[10px] font-medium text-white">
          Illustration · démonstration
        </span>
      )}
    </div>
  );
}
