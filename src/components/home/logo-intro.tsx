import Image from "next/image";

/** Animation du logo (0–2 s) : tracé du cercle orange, silhouette verte, révélation du nom. */
export function LogoIntro({ className = "" }: { className?: string }) {
  return (
    <div className={`logo-intro relative aspect-square ${className}`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle className="logo-ring" cx="100" cy="100" r="88" fill="none" stroke="#fa4705" strokeWidth="11" pathLength={1} />
      </svg>
      <Image src="/brand/logo-car.png" alt="" width={900} height={265} priority className="logo-car absolute left-[10%] top-[29%] w-[80%]" />
      <div className="logo-word absolute left-[2%] top-[54%] w-[96%] rounded-md bg-white/0">
        <Image src="/brand/logo-wordmark.png" alt="AUTO225.COM" width={1000} height={152} priority className="w-full" />
      </div>
    </div>
  );
}
