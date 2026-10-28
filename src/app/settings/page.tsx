"use client";

import { useEffect, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHydrated, useStore } from "@/hooks/use-store";
import {
  addShelfLocation,
  removeGenre,
  removeShelfLocation,
  resetDemoData,
  updateSettings,
  addGenre,
} from "@/lib/store";
import type { Genre } from "@/lib/types";

export default function SettingsPage() {
  const hydrated = useHydrated();
  const { settings, suppliers } = useStore();
  const [shopName, setShopName] = useState("");
  const [reorderPoint, setReorderPoint] = useState("3");
  const [newGenre, setNewGenre] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setShopName(settings.shopName);
    setReorderPoint(String(settings.defaultReorderPoint));
  }, [hydrated, settings.shopName, settings.defaultReorderPoint]);

  const handleSaveShop = () => {
    const rp = Number(reorderPoint);
    if (!shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }
    if (!Number.isFinite(rp) || rp < 0) {
      toast.error("Default reorder point must be 0 or more");
      return;
    }
    updateSettings({
      shopName: shopName.trim(),
      defaultReorderPoint: rp,
    });
    toast.success("Settings saved");
  };

  const handleAddGenre = () => {
    const g = newGenre.trim() as Genre;
    if (!g) return;
    if (settings.genres.includes(g)) {
      toast.error("Genre already exists");
      return;
    }
    addGenre(g);
    setNewGenre("");
    toast.success(`Added genre “${g}”`);
  };

  const handleAddLocation = () => {
    const loc = newLocation.trim();
    if (!loc) return;
    if (settings.shelfLocations.includes(loc)) {
      toast.error("Location already exists");
      return;
    }
    addShelfLocation(loc);
    setNewLocation("");
    toast.success(`Added location “${loc}”`);
  };

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Shop preferences and demo controls."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shop details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop name</Label>
              <Input
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder">Default reorder point</Label>
              <Input
                id="reorder"
                type="number"
                min={0}
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used when adding new books
              </p>
            </div>
            <Button onClick={handleSaveShop}>Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-border px-3 py-2.5"
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.contactName} · {s.email} · {s.phone}
                </p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Supplier editing is fixed for this demo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Genres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {settings.genres.map((g) => (
                <li
                  key={g}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span className="text-sm">{g}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      removeGenre(g);
                      toast.success(`Removed “${g}”`);
                    }}
                    aria-label={`Remove ${g}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                placeholder="New genre"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGenre()}
              />
              <Button variant="outline" onClick={handleAddGenre}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shelf locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {settings.shelfLocations.map((loc) => (
                <li
                  key={loc}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span className="font-mono text-sm">{loc}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      removeShelfLocation(loc);
                      toast.success(`Removed “${loc}”`);
                    }}
                    aria-label={`Remove ${loc}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. D1-Front"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
              />
              <Button variant="outline" onClick={handleAddLocation}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 lg:col-span-2">
          <CardHeader>
            <CardTitle>Demo data</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Reset restores the original 60-book catalogue, sales history, and
              stock movements. Your local changes will be lost.
            </p>
            <Button variant="destructive" onClick={() => setResetOpen(true)}>
              <RotateCcw className="h-4 w-4" />
              Reset demo data
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears localStorage and re-seeds Harbour Lane Books with the
              sample catalogue. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const state = resetDemoData();
                setShopName(state.settings.shopName);
                setReorderPoint(String(state.settings.defaultReorderPoint));
                toast.success("Demo data reset");
                setResetOpen(false);
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
