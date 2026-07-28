"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/brand/logo";
import { Separator } from "@/components/ui/separator";
import { NAV_PRINCIPAL, NAV_ADMIN, NavLink } from "@/components/layout/nav-links";
import { Settings2 } from "lucide-react";

export function Sidebar() {
  const { utilisateur } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_PRINCIPAL.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {utilisateur.role === "administrateur" && (
          <>
            <Separator className="my-3" />
            <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Administration
            </p>
            {NAV_ADMIN.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      <div className="px-3 pb-5 pt-2">
        <NavLink item={{ href: "/profil", label: "Mon profil", icon: Settings2 }} />
      </div>
    </aside>
  );
}
