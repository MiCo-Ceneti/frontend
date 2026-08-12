"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AgentStatusBadge } from "@/components/shared/status-badges";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import type { Utilisateur, Service, Paginated, Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/constants";

const ROLES: Role[] = ["agent", "chef_service", "directeur", "administrateur"];

const FORM_INITIAL = {
  matricule: "", nom: "", prenom: "", email: "", telephone: "",
  role: "agent" as Role, poste: "", service: "", password: "",
};

export default function AdminUtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = React.useState<Utilisateur[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOuvert, setDialogOuvert] = React.useState(false);
  const [form, setForm] = React.useState(FORM_INITIAL);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  const charger = React.useCallback(async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        api.get<Paginated<Utilisateur>>("utilisateurs/"),
        api.get<Paginated<Service>>("services/"),
      ]);
      setUtilisateurs(u.results);
      setServices(s.results);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    charger();
  }, [charger]);

  async function creerUtilisateur(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await api.post("utilisateurs/", { ...form, service: form.service || null });
      toast.success("Utilisateur cree.");
      setForm(FORM_INITIAL);
      setDialogOuvert(false);
      charger();
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.detail as Record<string, unknown> | null;
        const premiereErreur = detail ? Object.values(detail)[0] : null;
        setErreur(Array.isArray(premiereErreur) ? String(premiereErreur[0]) : "Impossible de creer l'utilisateur.");
      } else {
        setErreur("Une erreur inattendue est survenue.");
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes et des roles"
        action={
          <Dialog open={dialogOuvert} onOpenChange={setDialogOuvert}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvel utilisateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={creerUtilisateur} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="matricule">Matricule</Label>
                    <Input id="matricule" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="prenom">Prenom</Label>
                    <Input id="prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="telephone">Telephone</Label>
                    <Input id="telephone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="poste">Poste</Label>
                    <Input id="poste" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Service</Label>
                    <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                      <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {erreur && <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">{erreur}</p>}

                <DialogFooter>
                  <Button type="submit" disabled={enCours}>
                    {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                    Creer l&apos;utilisateur
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <Skeleton className="h-64" />
      ) : utilisateurs.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Compte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilisateurs.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.nom_complet}</p>
                      <p className="font-mono text-xs text-muted-foreground">{u.matricule} — {u.email}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.service_nom || "-"}</TableCell>
                    <TableCell>{u.poste || "-"}</TableCell>
                    <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                    <TableCell><AgentStatusBadge statut={u.statut} /></TableCell>
                    <TableCell>
                      <Badge variant={u.actif ? "success" : "secondary"}>{u.actif ? "Actif" : "Desactive"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
