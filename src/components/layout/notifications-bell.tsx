"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import type { Notification, Paginated } from "@/lib/types";
import { formatDateTime, LIEN_NOTIFICATION } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Cloche de notifications in-app.
 *
 * Le compteur de non lues est interroge separement (endpoint dedie, plus leger)
 * toutes les 30 secondes, et immediatement rafraichi lorsqu'un push arrive au
 * premier plan (evenement `mico:notification-recue` emis par le PushProvider).
 */
export function NotificationsBell() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [nonLues, setNonLues] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [ouvert, setOuvert] = React.useState(false);

  const chargerCompteur = React.useCallback(async () => {
    try {
      const { non_lues } = await api.get<{ non_lues: number }>("notifications/non-lues/");
      setNonLues(non_lues);
    } catch {
      // silencieux : erreur reseau ponctuelle
    }
  }, []);

  const chargerListe = React.useCallback(async () => {
    try {
      const data = await api.get<Paginated<Notification>>("notifications/");
      setNotifications(data.results.slice(0, 8));
    } catch {
      // silencieux : la cloche reste vide
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    chargerCompteur();
    chargerListe();

    const intervalle = setInterval(chargerCompteur, 30_000);

    function surPush() {
      chargerCompteur();
      chargerListe();
    }
    window.addEventListener("mico:notification-recue", surPush);

    return () => {
      clearInterval(intervalle);
      window.removeEventListener("mico:notification-recue", surPush);
    };
  }, [chargerCompteur, chargerListe]);

  // Rechargement a l'ouverture du menu, pour ne jamais afficher de contenu perime.
  React.useEffect(() => {
    if (ouvert) chargerListe();
  }, [ouvert, chargerListe]);

  async function marquerLue(notification: Notification) {
    if (notification.lu) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, lu: true } : n))
    );
    setNonLues((n) => Math.max(0, n - 1));
    try {
      await api.post(`notifications/${notification.id}/lue/`);
    } catch {
      chargerCompteur();
      chargerListe();
    }
  }

  async function toutMarquerLu() {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    setNonLues(0);
    try {
      await api.post("notifications/toutes-lues/");
    } catch {
      chargerCompteur();
      chargerListe();
    }
  }

  function ouvrir(notification: Notification) {
    marquerLue(notification);
    const lien = notification.lien ?? LIEN_NOTIFICATION[notification.type] ?? "/notifications";
    setOuvert(false);
    router.push(lien);
  }

  return (
    <DropdownMenu open={ouvert} onOpenChange={setOuvert}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {nonLues > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-medium leading-none text-white">
              {nonLues > 9 ? "9+" : nonLues}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">
            Notifications {nonLues > 0 && `(${nonLues})`}
          </span>
          {nonLues > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.preventDefault();
                toutMarquerLu();
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout lire
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        {loading && <p className="px-3 py-4 text-sm text-muted-foreground">Chargement...</p>}

        {!loading && notifications.length === 0 && (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            Aucune notification pour le moment.
          </p>
        )}

        {notifications.length > 0 && (
          <ScrollArea className="max-h-96">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={(e) => {
                  e.preventDefault();
                  ouvrir(n);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-0.5 whitespace-normal px-3 py-2.5",
                  !n.lu && "bg-accent/40"
                )}
              >
                <div className="flex w-full items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      n.lu ? "bg-transparent" : "bg-status-info"
                    )}
                  />
                  <span className="text-sm font-medium">{n.titre}</span>
                </div>
                <p className="pl-3.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                <p className="pl-3.5 text-[11px] text-muted-foreground">
                  {formatDateTime(n.date_creation)}
                </p>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-sm">
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
