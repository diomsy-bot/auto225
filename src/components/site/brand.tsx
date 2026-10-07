import Image from "next/image";

/** Logo officiel rond avec la signature « La mobilité à votre mesure ». */
export function BrandLogo({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/brand/logo-auto225.png"
        alt="AUTO225.COM"
        width={152}
        height={152}
        priority
        className={`brand-logo h-[62px] w-[62px] rounded-full bg-white object-contain sm:h-[76px] sm:w-[76px] ${tone === "dark" ? "sm:h-[90px] sm:w-[90px]" : ""}`}
      />
      <span className={`text-[7px] leading-[1.8] font-semibold tracking-[0.14em] sm:text-[8px] ${tone === "dark" ? "text-[#d3e0d5]" : "text-brand-green"}`}>
        LA MOBILITÉ
        <br />À VOTRE MESURE
      </span>
    </span>
  );
}
