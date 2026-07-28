"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_LABELS } from "@/lib/constants";

function initiales(nom: string, prenom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export function UserMenu() {
  const { utilisateur } = useAuth();
  const router = useRouter();

  async function deconnexion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initiales(utilisateur.nom, utilisateur.prenom)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight">{utilisateur.nom_complet}</p>
            <p className="text-xs leading-tight text-muted-foreground">{ROLE_LABELS[utilisateur.role]}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{utilisateur.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profil">
            <User className="h-4 w-4" />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={deconnexion} className="text-status-danger focus:text-status-danger">
          <LogOut className="h-4 w-4" />
          Se deconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
