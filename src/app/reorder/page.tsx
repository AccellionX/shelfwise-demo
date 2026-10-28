"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Printer, PackageCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { StockStatusBadge } from "@/components/stock-status-badge";
import { useHydrated, useStore } from "@/hooks/use-store";
import {
  markReorderReceived,
  refreshReorderSuggestions,
  updateReorderItem,
} from "@/lib/store";
import { formatAUD, formatDate } from "@/lib/format";

export default function ReorderPage() {
  const hydrated = useHydrated();
  const { reorderList, books, suppliers, settings } = useStore();
  const [poSupplierId, setPoSupplierId] = useState<string | null>(null);

  const bookMap = useMemo(
    () => new Map(books.map((b) => [b.id, b])),
    [books]
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { supplierId: string; items: typeof reorderList }
    >();
    for (const item of reorderList) {
      const book = bookMap.get(item.bookId);
      if (!book) continue;
      const sid = book.supplierId;
      if (!map.has(sid)) map.set(sid, { supplierId: sid, items: [] });
      map.get(sid)!.items.push(item);
    }
    return Array.from(map.values());
  }, [reorderList, bookMap]);

  const handleRefresh = () => {
    refreshReorderSuggestions();
    toast.success("Reorder suggestions refreshed");
  };

  const handleMarkReceived = (supplierId: string) => {
    const group = grouped.find((g) => g.supplierId === supplierId);
    if (!group) return;
    const items = group.items
      .filter((i) => i.included && i.suggestedQty > 0)
      .map((i) => ({
        bookId: i.bookId,
        quantity: i.suggestedQty,
        supplierId,
      }));
    if (items.length === 0) {
      toast.error("No included items to receive");
      return;
    }
    markReorderReceived(items);
    toast.success(`Marked ${items.length} title(s) as received`);
    setPoSupplierId(null);
  };

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  const poSupplier = suppliers.find((s) => s.id === poSupplierId);
  const poGroup = grouped.find((g) => g.supplierId === poSupplierId);

  return (
    <div>
      <PageHeader
        title="Reorder List"
        description="Suggested orders where quantity is at or below reorder point."
        actions={
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh suggestions
          </Button>
        }
      />

      {grouped.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing to reorder"
          description="All titles are above their reorder points. Check back after sales."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ supplierId, items }) => {
            const supplier = suppliers.find((s) => s.id === supplierId);
            const included = items.filter((i) => i.included);
            const estimated = included.reduce((sum, i) => {
              const book = bookMap.get(i.bookId);
              return sum + (book?.costPrice ?? 0) * i.suggestedQty;
            }, 0);

            return (
              <Card key={supplierId} className="no-print">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{supplier?.name ?? "Unknown supplier"}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {included.length} of {items.length} included · est.{" "}
                      {formatAUD(estimated)} at cost
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPoSupplierId(supplierId)}
                    >
                      <Printer className="h-4 w-4" />
                      Generate PO
                    </Button>
                    <Button onClick={() => handleMarkReceived(supplierId)}>
                      <PackageCheck className="h-4 w-4" />
                      Mark as received
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => {
                    const book = bookMap.get(item.bookId);
                    if (!book) return null;
                    return (
                      <div
                        key={item.bookId}
                        className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-3 sm:flex-1">
                          <Checkbox
                            checked={item.included}
                            onCheckedChange={(c) =>
                              updateReorderItem(item.bookId, {
                                included: !!c,
                              })
                            }
                            className="mt-1"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{book.title}</p>
                              <StockStatusBadge book={book} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {book.author} · {book.isbn} · {book.quantityOnHand}{" "}
                              on hand · reorder at {book.reorderPoint}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:w-40">
                          <label className="text-xs text-muted-foreground">
                            Order qty
                          </label>
                          <Input
                            type="number"
                            min={0}
                            className="h-9"
                            value={item.suggestedQty}
                            onChange={(e) =>
                              updateReorderItem(item.bookId, {
                                suggestedQty: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Printable PO */}
      {poSupplier && poGroup && (
        <div className="fixed inset-0 z-50 overflow-auto bg-background">
          <div className="no-print sticky top-0 flex items-center justify-between border-b bg-card px-6 py-3">
            <p className="text-sm font-medium">Purchase order preview</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPoSupplierId(null)}>
                Close
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          <div className="mx-auto max-w-3xl bg-white p-8 text-black">
            <div className="mb-8 flex justify-between border-b border-stone-300 pb-6">
              <div>
                <h1 className="font-serif text-3xl font-semibold">
                  Purchase Order
                </h1>
                <p className="mt-1 text-sm text-stone-600">
                  {settings.shopName}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>Date: {formatDate(new Date())}</p>
                <p className="mt-1 text-stone-600">
                  PO-{poSupplier.id.slice(-6).toUpperCase()}-
                  {new Date().toISOString().slice(0, 10).replace(/-/g, "")}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Ship to
                </p>
                <p className="font-medium">{settings.shopName}</p>
                <p className="text-stone-600">Independent bookshop, Australia</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Supplier
                </p>
                <p className="font-medium">{poSupplier.name}</p>
                <p className="text-stone-600">{poSupplier.contactName}</p>
                <p className="text-stone-600">{poSupplier.email}</p>
                <p className="text-stone-600">{poSupplier.phone}</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-stone-800 text-left">
                  <th className="py-2 pr-2">ISBN</th>
                  <th className="py-2 pr-2">Title</th>
                  <th className="py-2 pr-2">Author</th>
                  <th className="py-2 pr-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit cost</th>
                  <th className="py-2 pl-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {poGroup.items
                  .filter((i) => i.included && i.suggestedQty > 0)
                  .map((item) => {
                    const book = bookMap.get(item.bookId)!;
                    return (
                      <tr key={item.bookId} className="border-b border-stone-200">
                        <td className="py-2.5 pr-2 font-mono text-xs">
                          {book.isbn}
                        </td>
                        <td className="py-2.5 pr-2">{book.title}</td>
                        <td className="py-2.5 pr-2 text-stone-600">
                          {book.author}
                        </td>
                        <td className="py-2.5 pr-2 text-right tabular-nums">
                          {item.suggestedQty}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {formatAUD(book.costPrice)}
                        </td>
                        <td className="py-2.5 pl-2 text-right tabular-nums">
                          {formatAUD(book.costPrice * item.suggestedQty)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="pt-4 text-right font-medium">
                    Estimated total (ex GST)
                  </td>
                  <td className="pt-4 pl-2 text-right font-semibold tabular-nums">
                    {formatAUD(
                      poGroup.items
                        .filter((i) => i.included)
                        .reduce((sum, i) => {
                          const b = bookMap.get(i.bookId);
                          return sum + (b?.costPrice ?? 0) * i.suggestedQty;
                        }, 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>

            <p className="mt-10 text-xs text-stone-500">
              Generated by Shelfwise for {settings.shopName}. Please confirm
              availability and pricing before shipping.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
