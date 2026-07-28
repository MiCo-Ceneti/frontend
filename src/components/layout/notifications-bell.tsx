"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import type { Notification, Paginated } from "@/lib/types";
import { formatDateTime } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const charger = React.useCallback(async () => {
    try {
      const data = await api.get<Paginated<Notification>>("notifications/");
      setNotifications(data.results.slice(0, 6));
    } catch {
      // silencieux : la cloche reste vide en cas d'erreur reseau ponctuelle
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    charger();
    const interval = setInterval(charger, 60_000);
    return () => clearInterval(interval);
  }, [charger]);

  const nonLues = notifications.filter((n) => !n.lu).length;

  async function marquerLue(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    try {
      await api.post(`notifications/${id}/lue/`);
    } catch {
      charger();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {nonLues > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-1.5 w-1.5 rounded-full bg-status-danger" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && <p className="px-2 py-3 text-sm text-muted-foreground">Chargement...</p>}
        {!loading && notifications.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">Aucune notification pour le moment.</p>
        )}
        {notifications.map((n) => (
          <DropdownMenuItem
            key={n.id}
            onClick={() => !n.lu && marquerLue(n.id)}
            className="flex flex-col items-start gap-0.5 whitespace-normal py-2"
          >
            <div className="flex w-full items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", n.lu ? "bg-transparent" : "bg-status-info")} />
              <span className="text-sm font-medium">{n.titre}</span>
            </div>
            <p className="pl-3.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
            <p className="pl-3.5 text-[11px] text-muted-foreground">{formatDateTime(n.date_creation)}</p>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-sm">
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
