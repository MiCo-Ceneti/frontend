"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Notification, Paginated } from "@/lib/types";
import { formatDateTime } from "@/lib/constants";

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const charger = React.useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<Notification>>("notifications/")
      .then((d) => setNotifications(d.results))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    charger();
  }, [charger]);

  async function marquerLue(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    await api.post(`notifications/${id}/lue/`).catch(() => charger());
  }

  const nonLues = notifications.filter((n) => !n.lu);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={nonLues.length > 0 ? `${nonLues.length} non lue(s)` : "Vous etes a jour"}
      />

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Aucune notification" description="Vous serez informe ici des evenements importants." />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn(!n.lu && "border-status-info/40")}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      n.lu ? "bg-transparent" : "bg-status-info"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">{n.titre}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.date_creation)}</p>
                  </div>
                </div>
                {!n.lu && (
                  <Button size="sm" variant="ghost" onClick={() => marquerLue(n.id)}>
                    Marquer comme lue
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
