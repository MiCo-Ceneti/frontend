"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Notification, Paginated } from "@/lib/types";
import { formatDateTime, LIEN_NOTIFICATION, TYPE_NOTIFICATION_LABELS } from "@/lib/constants";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filtre, setFiltre] = React.useState<"toutes" | "non-lues">("toutes");

  const charger = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<Paginated<Notification>>(
        "notifications/",
        filtre === "non-lues" ? { lu: false } : undefined
      );
      setNotifications(d.results);
    } finally {
      setLoading(false);
    }
  }, [filtre]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  React.useEffect(() => {
    function surPush() {
      charger();
    }
    window.addEventListener("mico:notification-recue", surPush);
    return () => window.removeEventListener("mico:notification-recue", surPush);
  }, [charger]);

  async function marquerLue(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    await api.post(`notifications/${id}/lue/`).catch(() => charger());
  }

  async function toutMarquerLu() {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    await api.post("notifications/toutes-lues/").catch(() => charger());
    if (filtre === "non-lues") charger();
  }

  async function supprimer(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await api.delete(`notifications/${id}/`).catch(() => charger());
  }

  function ouvrir(notification: Notification) {
    if (!notification.lu) marquerLue(notification.id);
    router.push(notification.lien ?? LIEN_NOTIFICATION[notification.type] ?? "/notifications");
  }

  const nonLues = notifications.filter((n) => !n.lu);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={nonLues.length > 0 ? `${nonLues.length} non lue(s)` : "Vous etes a jour"}
        action={
          nonLues.length > 0 && (
            <Button size="sm" variant="outline" onClick={toutMarquerLu}>
              <CheckCheck className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )
        }
      />

      <Tabs
        value={filtre}
        onValueChange={(v) => setFiltre(v as "toutes" | "non-lues")}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="toutes">Toutes</TabsTrigger>
          <TabsTrigger value="non-lues">Non lues</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filtre === "non-lues" ? "Aucune notification non lue" : "Aucune notification"}
          description="Vous serez informe ici des evenements importants : missions, conges, soldes."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn(!n.lu && "border-status-info/40 bg-accent/20")}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <button
                  type="button"
                  onClick={() => ouvrir(n)}
                  className="flex flex-1 items-start gap-3 text-left"
                >
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      n.lu ? "bg-transparent" : "bg-status-info"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{n.titre}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {TYPE_NOTIFICATION_LABELS[n.type] ?? n.type}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(n.date_creation)}
                    </p>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  {!n.lu && (
                    <Button size="sm" variant="ghost" onClick={() => marquerLue(n.id)}>
                      Marquer comme lue
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => supprimer(n.id)}
                    aria-label="Supprimer la notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
