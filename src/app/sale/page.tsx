"use client";

import { useMemo, useRef, useState } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useHydrated, useStore } from "@/hooks/use-store";
import { completeSale, findBooksByQuery } from "@/lib/store";
import { formatAUD } from "@/lib/format";
import type { Book } from "@/lib/types";

interface CartLine {
  bookId: string;
  quantity: number;
  unitPrice: number;
}

export default function QuickSalePage() {
  const hydrated = useHydrated();
  const { books } = useStore();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const bookMap = useMemo(
    () => new Map(books.map((b) => [b.id, b])),
    [books]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return findBooksByQuery(query).slice(0, 8);
  }, [query, books]);

  const total = cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  const addToCart = (book: Book) => {
    if (book.quantityOnHand <= 0) {
      toast.error(`“${book.title}” is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.bookId === book.id);
      if (existing) {
        if (existing.quantity >= book.quantityOnHand) {
          toast.error("Not enough stock");
          return prev;
        }
        return prev.map((l) =>
          l.bookId === book.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        { bookId: book.id, quantity: 1, unitPrice: book.retailPrice },
      ];
    });
    setQuery("");
    inputRef.current?.focus();
  };

  const handleScan = () => {
    const q = query.trim();
    if (!q) return;
    const exactIsbn = books.find(
      (b) => b.isbn.replace(/[-\s]/g, "") === q.replace(/[-\s]/g, "")
    );
    if (exactIsbn) {
      addToCart(exactIsbn);
      return;
    }
    const matches = findBooksByQuery(q);
    if (matches.length === 1) {
      addToCart(matches[0]);
    } else if (matches.length === 0) {
      toast.error("No matching book found");
    }
    // else leave results visible for selection
  };

  const setQty = (bookId: string, quantity: number) => {
    const book = bookMap.get(bookId);
    if (!book) return;
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.bookId !== bookId));
      return;
    }
    if (quantity > book.quantityOnHand) {
      toast.error(`Only ${book.quantityOnHand} on hand`);
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.bookId === bookId ? { ...l, quantity } : l))
    );
  };

  const handleComplete = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    try {
      const sale = completeSale(cart);
      toast.success(`Sale complete: ${formatAUD(sale.total)}`);
      setCart([]);
      inputRef.current?.focus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sale failed");
    }
  };

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div>
      <PageHeader
        title="Quick Sale"
        description="Scan or search, add to cart, and complete the sale."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScan();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    className="pl-9"
                    placeholder="Scan ISBN or search title / author…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit">Add</Button>
              </form>

              {results.length > 0 && (
                <ul className="mt-3 divide-y divide-border rounded-lg border">
                  {results.map((book) => (
                    <li key={book.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/50"
                        onClick={() => addToCart(book)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {book.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {book.author} · {book.isbn} · {book.quantityOnHand}{" "}
                            on hand
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium tabular-nums">
                          {formatAUD(book.retailPrice)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular right now</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {books
                .filter((b) => b.quantityOnHand > 0)
                .slice(0, 6)
                .map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => addToCart(book)}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
                  >
                    <p className="truncate text-sm font-medium">{book.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatAUD(book.retailPrice)} · {book.quantityOnHand} left
                    </p>
                  </button>
                ))}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 lg:sticky lg:top-4 lg:self-start">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Cart</CardTitle>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCart([])}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Cart is empty"
                description="Search or tap a title to add it."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="space-y-3">
                {cart.map((line) => {
                  const book = bookMap.get(line.bookId);
                  if (!book) return null;
                  return (
                    <li
                      key={line.bookId}
                      className="flex items-start gap-3 border-b border-border pb-3 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">
                          {book.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAUD(line.unitPrice)} each
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setQty(line.bookId, line.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm tabular-nums">
                            {line.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setQty(line.bookId, line.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-8 w-8"
                            onClick={() => setQty(line.bookId, 0)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatAUD(line.quantity * line.unitPrice)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-serif text-2xl font-semibold tabular-nums">
                  {formatAUD(total)}
                </span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={cart.length === 0}
                onClick={handleComplete}
              >
                Complete sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
