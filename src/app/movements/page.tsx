"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useHydrated, useStore } from "@/hooks/use-store";
import { addStockMovement } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import type { MovementType } from "@/lib/types";

const REASONS: Record<MovementType, string[]> = {
  stock_in: ["delivery", "return_from_customer", "other"],
  stock_out: ["sale", "damage", "return_to_supplier", "other"],
  adjustment: ["stocktake", "correction", "other"],
};

function reasonLabel(reason: string) {
  return reason.replace(/_/g, " ");
}

export default function MovementsPage() {
  const hydrated = useHydrated();
  const { movements, books, suppliers } = useStore();

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [bookFilter, setBookFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [type, setType] = useState<MovementType>("stock_in");
  const [bookId, setBookId] = useState("");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("delivery");
  const [notes, setNotes] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const bookMap = useMemo(
    () => new Map(books.map((b) => [b.id, b])),
    [books]
  );

  const filtered = useMemo(() => {
    const q = bookFilter.trim().toLowerCase();
    return [...movements]
      .reverse()
      .filter((m) => {
        if (typeFilter !== "all" && m.type !== typeFilter) return false;
        if (q) {
          const book = bookMap.get(m.bookId);
          if (!book) return false;
          const hay = `${book.title} ${book.author} ${book.isbn}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [movements, typeFilter, bookFilter, bookMap]);

  const openDialog = () => {
    setType("stock_in");
    setBookId(books[0]?.id ?? "");
    setQty(1);
    setReason("delivery");
    setNotes("");
    setSupplierId(suppliers[0]?.id ?? "");
    setDialogOpen(true);
  };

  const handleTypeChange = (t: MovementType) => {
    setType(t);
    setReason(REASONS[t][0]);
  };

  const handleSubmit = () => {
    if (!bookId) {
      toast.error("Select a book");
      return;
    }
    if (!reason) {
      toast.error("A reason is required");
      return;
    }
    if (type === "adjustment") {
      if (qty === 0 || Number.isNaN(qty)) {
        toast.error("Enter a non-zero adjustment");
        return;
      }
    } else if (qty <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    try {
      const book = bookMap.get(bookId);
      const quantity =
        type === "adjustment"
          ? qty
          : type === "stock_out"
            ? -Math.abs(qty)
            : Math.abs(qty);

      addStockMovement({
        bookId,
        type,
        quantity,
        reason,
        notes: notes || undefined,
        relatedSupplierId:
          type === "stock_in" || reason === "return_to_supplier"
            ? supplierId || undefined
            : undefined,
      });
      toast.success(
        `Logged ${type.replace("_", " ")} for “${book?.title ?? "book"}”`
      );
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log movement");
    }
  };

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Full audit trail of every stock change."
        actions={
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4" />
            Log movement
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <Input
            placeholder="Filter by title, author, ISBN…"
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="stock_in">Stock in</SelectItem>
              <SelectItem value="stock_out">Stock out</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No movements found"
          description="Log a stock in, stock out, or adjustment to get started."
          action={
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4" />
              Log movement
            </Button>
          }
        />
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Before → After</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const book = bookMap.get(m.bookId);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDateTime(m.date)}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{book?.title ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {book?.isbn}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              m.type === "stock_in"
                                ? "success"
                                : m.type === "stock_out"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {m.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {reasonLabel(m.reason)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            m.quantity > 0 ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {m.quantityBefore} → {m.quantityAfter}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {m.notes ?? "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-3 md:hidden">
            {filtered.map((m) => {
              const book = bookMap.get(m.bookId);
              return (
                <Card key={m.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{book?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(m.date)}
                        </p>
                      </div>
                      <span
                        className={`font-semibold tabular-nums ${
                          m.quantity > 0 ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">
                        {m.type.replace("_", " ")}
                      </Badge>
                      <span className="capitalize text-muted-foreground">
                        {reasonLabel(m.reason)}
                      </span>
                      <span className="text-muted-foreground">
                        {m.quantityBefore} → {m.quantityAfter}
                      </span>
                    </div>
                    {m.notes && (
                      <p className="text-xs text-muted-foreground">{m.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log stock movement</DialogTitle>
            <DialogDescription>
              Every change needs a reason so you can see why a number moved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => handleTypeChange(v as MovementType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_in">Stock in (delivery)</SelectItem>
                  <SelectItem value="stock_out">Stock out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Book</Label>
              <Select value={bookId} onValueChange={setBookId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  {books
                    .slice()
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.title} ({b.quantityOnHand} on hand)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>
                  {type === "adjustment"
                    ? "Change (+/−)"
                    : "Quantity"}
                </Label>
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  min={type === "adjustment" ? undefined : 1}
                />
                {type === "adjustment" && (
                  <p className="text-xs text-muted-foreground">
                    Use negative to reduce stock
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS[type].map((r) => (
                      <SelectItem key={r} value={r}>
                        {reasonLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(type === "stock_in" || reason === "return_to_supplier") && (
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Damaged corner, publisher recall…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save movement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
