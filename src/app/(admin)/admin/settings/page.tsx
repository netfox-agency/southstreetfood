"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Save, ShieldAlert, Clock, Power } from "lucide-react";
import { toast } from "sonner";

type EmergencyState = {
  active: boolean;
  message: string | null;
  activatedAt: string | null;
  autoDisableAt: string | null;
  logs: Array<{
    id: string;
    action: string;
    actor_role: string | null;
    message: string | null;
    created_at: string;
  }>;
  role: string;
};

function formatRel(iso: string | null): string {
  if (!iso) return "";
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const future = diff > 0;
  if (abs < 60) return future ? "dans <1 min" : "il y a <1 min";
  if (abs < 3600) {
    const m = Math.round(abs / 60);
    return future ? `dans ${m} min` : `il y a ${m} min`;
  }
  const h = Math.round(abs / 3600);
  return future ? `dans ${h}h` : `il y a ${h}h`;
}

function EmergencyModeCard() {
  const [state, setState] = useState<EmergencyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/emergency-mode", { cache: "no-store" });
      if (!r.ok) throw new Error("Fetch failed");
      const data: EmergencyState = await r.json();
      setState(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const toggle = async (active: boolean) => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/emergency-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active,
          message: customMessage.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }
      toast.success(
        active
          ? "Mode urgence ACTIVE. Les commandes en ligne sont coupees."
          : "Mode urgence desactive. Les commandes en ligne sont a nouveau ouvertes.",
      );
      setShowConfirm(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mode urgence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const active = state.active;
  const isAdmin = state.role === "admin";

  return (
    <Card
      className={
        active
          ? "border-red-300 bg-red-50/40"
          : "border-amber-200/50 bg-amber-50/20"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert
            className={
              active ? "h-5 w-5 text-red-600" : "h-5 w-5 text-amber-600"
            }
          />
          Mode urgence
          {active && (
            <span className="text-xs font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full ml-2">
              ACTIF
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Kill-switch des commandes en ligne. La carte reste visible mais les
          clients ne peuvent plus commander. Un banner rouge avec le numero de
          tel s&apos;affiche. A utiliser en cas de bug systeme, imprimante HS,
          rush ingerable, etc.
        </p>

        {active && (
          <div className="bg-white rounded-xl border border-red-200 p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Commande en ligne BLOQUEE
            </div>
            {state.message && (
              <p className="text-foreground italic">
                &laquo; {state.message} &raquo;
              </p>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="h-3.5 w-3.5" />
              Active {formatRel(state.activatedAt)}
              {state.autoDisableAt && (
                <span className="ml-2">
                  &middot; auto-desactivation {formatRel(state.autoDisableAt)}
                </span>
              )}
            </div>
          </div>
        )}

        {!active && (
          <div className="space-y-3">
            <Input
              label="Message personnalise (optionnel)"
              placeholder="Ex : Imprimante en panne, appelez-nous au 07 69 79 91 89"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              maxLength={500}
            />
            <p className="text-[11px] text-muted-foreground">
              Si vide, message par defaut. Auto-desactivation au bout de 4h pour
              eviter d&apos;oublier.
            </p>
          </div>
        )}

        {showConfirm ? (
          <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-red-900">
              Confirmer l&apos;activation du mode urgence ?
            </p>
            <p className="text-xs text-red-800">
              Tous les clients sur le site verront un banner rouge et ne
              pourront plus commander en ligne. Effet immediat.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => toggle(true)}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <Power className="h-4 w-4" />
                Oui, activer maintenant
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : active ? (
          isAdmin ? (
            <Button
              onClick={() => toggle(false)}
              disabled={submitting}
              variant="outline"
              className="gap-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              <Power className="h-4 w-4" />
              Desactiver le mode urgence
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Seul un admin peut desactiver le mode urgence.
            </p>
          )
        ) : (
          <Button
            onClick={() => setShowConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <ShieldAlert className="h-4 w-4" />
            Activer le mode urgence
          </Button>
        )}

        {state.logs.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Historique ({state.logs.length})
            </summary>
            <ul className="mt-2 space-y-1 pl-4">
              {state.logs.map((log) => (
                <li key={log.id} className="text-muted-foreground">
                  <span className="font-mono">
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                  </span>
                  {" · "}
                  <span className="font-medium">{log.action}</span>
                  {log.actor_role && (
                    <span className="opacity-70"> ({log.actor_role})</span>
                  )}
                  {log.message && <span> &mdash; {log.message}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const handleSave = () => {
    toast.success("Parametres sauvegardes");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Parametres
          </h1>
          <p className="mt-1 text-muted-foreground">
            Configuration du restaurant
          </p>
        </div>
        <Button className="gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Sauvegarder
        </Button>
      </div>

      <div className="grid gap-6">
        <EmergencyModeCard />

        <Card>
          <CardHeader>
            <CardTitle>Informations generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nom du restaurant" defaultValue="SOUTH STREET FOOD" />
            <Input label="Telephone" placeholder="07 69 79 91 89" />
            <Input label="Email" placeholder="contact@southstreetfood.fr" />
            <Input label="Adresse" placeholder="Bayonne, France" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commandes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Temps de preparation estime (minutes)"
              type="number"
              defaultValue="20"
            />
            <Input
              label="Commande minimum livraison (EUR)"
              type="number"
              defaultValue="10"
            />
            <Input
              label="Frais de livraison de base (EUR)"
              type="number"
              defaultValue="3.50"
            />
            <Input
              label="Rayon de livraison (km)"
              type="number"
              defaultValue="15"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programme fidelite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Points par euro depense"
              type="number"
              defaultValue="10"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
