import Link from "next/link";
import { Shield } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 transition group-hover:scale-105">
        <Shield className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="text-lg font-bold tracking-tight">
        Regul<span className="text-primary">Arena</span>
      </span>
    </Link>
  );
}
