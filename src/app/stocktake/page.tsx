"use client";

import { useMemo, useState } from "react";
import { ScanLine, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
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
import { applyStocktakeAdjustments } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function StocktakePage() {
  const hydrated = useHydrated();
  const { books, settings } = useStore();
  const [location, setLocation] = useState<string>("");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const shelfBooks = useMemo(() => {
    if (!location) return [];
    return books
      .filter((b) => b.shelfLocation === location)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [books, location]);

  const variances = useMemo(() => {
    return shelfBooks.map((book) => {
      const raw = counts[book.id];
      const counted =
        raw === undefined || raw === "" ? null : Number(raw);
      const variance =
        counted === null || Number.isNaN(counted)
          ? null
          : counted - book.quantityOnHand;
      return { book, counted, variance };
    });
  }, [shelfBooks, counts]);

  const readyCount = variances.filter((v) => v.counted !== null).length;
  const changedCount = variances.filter(
    (v) => v.variance !== null && v.variance !== 0
  ).length;

  const handleApply = () => {
    const payload = variances
      .filter((v) => v.counted !== null && !Number.isNaN(v.counted!))
      .map((v) => ({ bookId: v.book.id, countedQty: v.counted! }));

    if (payload.length === 0) {
      toast.error("Enter at least one counted quantity");
      return;
    }

    const applied = applyStocktakeAdjustments(payload);
    toast.success(
      applied === 0
        ? "All counts matched - no adjustments needed"
        : `Applied ${applied} stocktake adjustment(s)`
    );
    setCounts({});
    setConfirmOpen(false);
  };

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div>
      <PageHeader
        title="Stocktake"
        description="Pick a shelf, count what's there, and apply variances in one click."
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Shelf location</label>
            <Select
              value={location || undefined}
              onValueChange={(v) => {
                setLocation(v);
                setCounts({});
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a shelf to count…" />
              </SelectTrigger>
              <SelectContent>
                {settings.shelfLocations.map((loc) => {
                  const n = books.filter((b) => b.shelfLocation === loc).length;
                  return (
                    <SelectItem key={loc} value={loc}>
                      {loc} ({n} titles)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {location && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const next: Record<string, string> = {};
                  for (const b of shelfBooks) {
                    next[b.id] = String(b.quantityOnHand);
                  }
                  setCounts(next);
                  toast.message("Filled expected quantities - adjust as needed");
                }}
              >
                Prefill expected
              </Button>
              <Button
                disabled={readyCount === 0}
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Apply adjustments
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!location ? (
        <EmptyState
          icon={ScanLine}
          title="Select a shelf to begin"
          description="Guided count mode walks you through one location at a time."
        />
      ) : shelfBooks.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title="No books on this shelf"
          description="Try another location, or assign books to this shelf in the catalogue."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Counting {location}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {readyCount}/{shelfBooks.length} counted · {changedCount} variance
                {changedCount === 1 ? "" : "s"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Header */}
            <div className="hidden grid-cols-12 gap-3 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
              <div className="col-span-5">Title</div>
              <div className="col-span-2 text-right">Expected</div>
              <div className="col-span-2 text-right">Counted</div>
              <div className="col-span-3 text-right">Variance</div>
            </div>

            {variances.map(({ book, counted, variance }) => (
              <div
                key={book.id}
                className={cn(
                  "grid grid-cols-1 gap-2 rounded-lg border p-3 md:grid-cols-12 md:items-center md:gap-3",
                  variance !== null && variance !== 0
                    ? variance > 0
                      ? "border-emerald-300 bg-emerald-50/60"
                      : "border-amber-300 bg-amber-50/60"
                    : "border-border"
                )}
              >
                <div className="md:col-span-5">
                  <p className="font-medium leading-snug">{book.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {book.author} · {book.isbn}
                  </p>
                </div>
                <div className="flex items-center justify-between md:col-span-2 md:justify-end">
                  <span className="text-xs text-muted-foreground md:hidden">
                    Expected
                  </span>
                  <span className="tabular-nums font-medium">
                    {book.quantityOnHand}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 md:col-span-2 md:justify-end">
                  <span className="text-xs text-muted-foreground md:hidden">
                    Counted
                  </span>
                  <Input
                    type="number"
                    min={0}
                    className="h-9 w-24 text-right"
                    placeholder="-"
                    value={counts[book.id] ?? ""}
                    onChange={(e) =>
                      setCounts((c) => ({ ...c, [book.id]: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between md:col-span-3 md:justify-end">
                  <span className="text-xs text-muted-foreground md:hidden">
                    Variance
                  </span>
                  <span
                    className={cn(
                      "tabular-nums font-semibold",
                      variance === null && "text-muted-foreground",
                      variance !== null &&
                        variance > 0 &&
                        "text-emerald-700",
                      variance !== null && variance < 0 && "text-amber-800",
                      variance === 0 && "text-muted-foreground"
                    )}
                  >
                    {variance === null
                      ? "-"
                      : variance > 0
                        ? `+${variance}`
                        : variance}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply stocktake adjustments?</AlertDialogTitle>
            <AlertDialogDescription>
              {changedCount === 0
                ? "All entered counts match expected quantities. No stock will change."
                : `${changedCount} title(s) will be adjusted with reason “stocktake”. This writes to the audit trail.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply}>
              Apply adjustments
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
