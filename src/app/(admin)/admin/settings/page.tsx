"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";

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
        <Card>
          <CardHeader>
            <CardTitle>Informations generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nom du restaurant" defaultValue="SOUTH STREET FOOD" />
            <Input label="Telephone" placeholder="05 59 XX XX XX" />
            <Input label="Email" placeholder="contact@southstreetfood.fr" />
            <Input label="Adresse" placeholder="Bayonne, France" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commandes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Temps de preparation estime (minutes)" type="number" defaultValue="20" />
            <Input label="Commande minimum livraison (EUR)" type="number" defaultValue="10" />
            <Input label="Frais de livraison de base (EUR)" type="number" defaultValue="3.50" />
            <Input label="Rayon de livraison (km)" type="number" defaultValue="15" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programme fidelite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Points par euro depense" type="number" defaultValue="10" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
