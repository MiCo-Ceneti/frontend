"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  CalendarClock,
  Bell,
  Users,
  Building2,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_PRINCIPAL: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/missions", label: "Missions", icon: Briefcase },
  { href: "/conges", label: "Conges", icon: CalendarClock },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export const NAV_ADMIN: NavItem[] = [
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/organisation", label: "Directions & services", icon: Building2 },
  { href: "/admin/parametres", label: "Parametres", icon: SlidersHorizontal },
];

export function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-foreground font-medium"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
