import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar({ title }: { title?: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        {title && <h1 className="text-sm font-medium">{title}</h1>}
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationsBell />
        <UserMenu />
      </div>
    </header>
  );
}
