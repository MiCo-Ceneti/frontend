"use client";

type Methode = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiOptions = {
  method?: Methode;
  body?: unknown;
  /** Corps multipart : utilise tel quel, sans Content-Type impose. */
  formData?: FormData;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown, message?: string) {
    super(message ?? "Erreur API");
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Extrait un message lisible depuis une reponse d'erreur DRF, quelle que soit
 * sa forme : {detail}, {champ: [msg]}, {non_field_errors: [...]}.
 */
export function messageErreur(err: unknown, defaut = "Une erreur est survenue.") {
  if (!(err instanceof ApiError)) return defaut;
  const detail = err.detail as Record<string, unknown> | string | null;
  if (typeof detail === "string") return detail;
  if (!detail) return defaut;
  if (typeof detail.detail === "string") return detail.detail;
  if (Array.isArray(detail.non_field_errors)) return String(detail.non_field_errors[0]);
  const premiere = Object.values(detail)[0];
  if (Array.isArray(premiere)) return String(premiere[0]);
  if (typeof premiere === "string") return premiere;
  return defaut;
}

function buildUrl(path: string, params?: ApiOptions["params"]) {
  const entries = params
    ? Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)
    : [];
  const query = entries.length
    ? "?" +
      entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return `/api/backend/${path.replace(/^\/+/, "")}${query}`;
}

// ---------------------------------------------------------------------------
// Refresh silencieux : un seul appel concurrent (verrou), aucune redirection
// forcee depuis cette couche. Quand la session est definitivement perdue, on
// previent l'AuthProvider via un evenement : c'est lui qui decide quoi faire.
// C'est ce qui evite la boucle infinie vers /login.
// ---------------------------------------------------------------------------
export const EVENEMENT_SESSION_EXPIREE = "mico:session-expiree";

let refreshEnCours: Promise<boolean> | null = null;

async function rafraichirSession(): Promise<boolean> {
  if (refreshEnCours) return refreshEnCours;

  refreshEnCours = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      return res.ok;
    } catch {
      return false;
    } finally {
      // Le verrou est relache au tick suivant pour que les appels declenches
      // en parallele partagent bien la meme promesse.
      setTimeout(() => {
        refreshEnCours = null;
      }, 0);
    }
  })();

  return refreshEnCours;
}

function signalerSessionExpiree() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENEMENT_SESSION_EXPIREE));
}

async function request<T>(path: string, options: ApiOptions = {}, retry = true): Promise<T> {
  const estMultipart = Boolean(options.formData);

  const res = await fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    // En multipart, le navigateur DOIT poser lui-meme le Content-Type avec sa
    // boundary : on ne surcharge donc pas les en-tetes.
    headers: !estMultipart && options.body ? { "Content-Type": "application/json" } : undefined,
    body: estMultipart ? options.formData : options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 401 && retry) {
    const renouvele = await rafraichirSession();
    if (renouvele) {
      return request<T>(path, options, false);
    }
    signalerSessionExpiree();
    throw new ApiError(401, null, "Session expiree.");
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data, messageErreur(new ApiError(res.status, data)));
  }

  return data as T;
}

/**
 * Construit un FormData a partir d'un objet simple.
 * - `File` / `Blob`      -> ajoute tel quel
 * - tableau de fichiers  -> ajoute sous la meme cle (cle repetee, format DRF)
 * - `undefined` / `null` -> ignore
 */
export function versFormData(donnees: Record<string, unknown>): FormData {
  const formData = new FormData();

  for (const [cle, valeur] of Object.entries(donnees)) {
    if (valeur === undefined || valeur === null || valeur === "") continue;

    if (valeur instanceof File || valeur instanceof Blob) {
      formData.append(cle, valeur);
      continue;
    }

    if (Array.isArray(valeur)) {
      for (const element of valeur) {
        if (element === undefined || element === null) continue;
        formData.append(
          cle,
          element instanceof File || element instanceof Blob ? element : String(element)
        );
      }
      continue;
    }

    formData.append(cle, typeof valeur === "boolean" ? String(valeur) : String(valeur));
  }

  return formData;
}

export const api = {
  get: <T>(path: string, params?: ApiOptions["params"], signal?: AbortSignal) =>
    request<T>(path, { method: "GET", params, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  /** Envoi multipart (fichiers reels). Le backend se charge de Cloudinary. */
  upload: <T>(path: string, donnees: Record<string, unknown> | FormData, method: Methode = "POST") =>
    request<T>(path, {
      method,
      formData: donnees instanceof FormData ? donnees : versFormData(donnees),
    }),
};
