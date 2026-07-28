"use client";

import * as React from "react";
import { Menu, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NAV_PRINCIPAL, NAV_ADMIN, NavLink } from "@/components/layout/nav-links";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/brand/logo";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const { utilisateur } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir la navigation">
        <Menu className="h-4 w-4" />
      </Button>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>
            <Logo subtitle={false} />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_PRINCIPAL.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
          ))}

          {utilisateur.role === "administrateur" && (
            <>
              <Separator className="my-3" />
              <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Administration
              </p>
              {NAV_ADMIN.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </>
          )}

          <Separator className="my-3" />
          <NavLink
            item={{ href: "/profil", label: "Mon profil", icon: Settings2 }}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
