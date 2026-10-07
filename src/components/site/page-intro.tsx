/** Bandeau d'introduction des pages intérieures (fond crème, surtitre, grand titre). */
export function PageIntro({ eyebrow, title, children, actions, art }: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  art?: React.ReactNode;
}) {
  return (
    <section className="border-t border-[#e9eee4] bg-surface">
      <div className={`container-page py-10 sm:py-16 ${art ? "lg:grid lg:grid-cols-[1.5fr_1fr] lg:items-center" : ""}`}>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 mb-4 max-w-3xl text-[34px] leading-[1.14] font-bold tracking-[-0.03em] sm:text-5xl">{title}</h1>
          {children && <div className="max-w-xl text-[15px] leading-[1.75] text-[#6a756e]">{children}</div>}
          {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {art && (
          <div className="hidden h-full min-h-48 place-items-center bg-[radial-gradient(circle,#dce9d6,transparent_65%)] text-brand-green lg:grid" aria-hidden="true">
            {art}
          </div>
        )}
      </div>
    </section>
  );
}
