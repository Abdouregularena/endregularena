import { cn } from "@/lib/utils";

export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose-content mx-auto max-w-3xl text-[15px] leading-relaxed text-foreground/90",
        "[&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight",
        "[&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_p]:mt-4",
        "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2",
        "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2",
        "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80",
        "[&_strong]:font-semibold",
        className
      )}
    >
      {children}
    </div>
  );
}
