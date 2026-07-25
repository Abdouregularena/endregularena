export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-muted/30 py-16 lg:py-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="container-app text-center">
        {eyebrow && <span className="badge">{eyebrow}</span>}
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
