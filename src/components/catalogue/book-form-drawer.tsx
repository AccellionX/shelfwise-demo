"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lookupIsbn } from "@/lib/isbn";
import { upsertBook, type BookInput } from "@/lib/store";
import type { Book, Condition, Genre } from "@/lib/types";
import { useStore } from "@/hooks/use-store";

const emptyForm = (defaults: {
  reorderPoint: number;
  supplierId: string;
  shelfLocation: string;
  genre: Genre;
}): BookInput => ({
  isbn: "",
  title: "",
  author: "",
  genre: defaults.genre,
  publisher: "",
  shelfLocation: defaults.shelfLocation,
  quantityOnHand: 0,
  reorderPoint: defaults.reorderPoint,
  costPrice: 0,
  retailPrice: 0,
  supplierId: defaults.supplierId,
  condition: "New",
});

export function BookFormDrawer({
  open,
  onOpenChange,
  book,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book | null;
}) {
  const { settings, suppliers } = useStore();
  const [form, setForm] = useState<BookInput>(
    emptyForm({
      reorderPoint: settings.defaultReorderPoint,
      supplierId: suppliers[0]?.id ?? "",
      shelfLocation: settings.shelfLocations[0] ?? "A1-Front",
      genre: (settings.genres[0] as Genre) ?? "Fiction",
    })
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (book) {
      setForm({
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        genre: book.genre,
        publisher: book.publisher,
        shelfLocation: book.shelfLocation,
        quantityOnHand: book.quantityOnHand,
        reorderPoint: book.reorderPoint,
        costPrice: book.costPrice,
        retailPrice: book.retailPrice,
        supplierId: book.supplierId,
        condition: book.condition,
        dateAdded: book.dateAdded,
      });
    } else {
      setForm(
        emptyForm({
          reorderPoint: settings.defaultReorderPoint,
          supplierId: suppliers[0]?.id ?? "",
          shelfLocation: settings.shelfLocations[0] ?? "A1-Front",
          genre: (settings.genres[0] as Genre) ?? "Fiction",
        })
      );
    }
    setErrors({});
  }, [open, book, settings, suppliers]);

  const set = <K extends keyof BookInput>(key: K, value: BookInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.isbn.trim()) next.isbn = "ISBN is required";
    else if (!/^\d{10}(\d{3})?$/.test(form.isbn.replace(/[-\s]/g, ""))) {
      next.isbn = "Use a 10 or 13 digit ISBN";
    }
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.author.trim()) next.author = "Author is required";
    if (form.quantityOnHand < 0) next.quantityOnHand = "Cannot be negative";
    if (form.reorderPoint < 0) next.reorderPoint = "Cannot be negative";
    if (form.costPrice < 0) next.costPrice = "Cannot be negative";
    if (form.retailPrice < 0) next.retailPrice = "Cannot be negative";
    if (!form.supplierId) next.supplierId = "Select a supplier";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLookup = async () => {
    setLookingUp(true);
    try {
      const result = await lookupIsbn(form.isbn);
      setForm((f) => ({
        ...f,
        title: result.title ?? f.title,
        author: result.author ?? f.author,
        publisher: result.publisher ?? f.publisher,
      }));
      toast.success("Details filled from Open Library");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = () => {
    if (!validate()) return;
    const saved = upsertBook({
      ...form,
      isbn: form.isbn.replace(/[-\s]/g, ""),
    });
    toast.success(book ? `Updated “${saved.title}”` : `Added “${saved.title}”`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{book ? "Edit book" : "Add book"}</SheetTitle>
          <SheetDescription>
            {book
              ? "Update catalogue details for this title."
              : "Add a new title to the catalogue."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <div className="flex gap-2">
              <Input
                id="isbn"
                value={form.isbn}
                onChange={(e) => set("isbn", e.target.value)}
                placeholder="978..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLookup}
                disabled={lookingUp || !form.isbn.trim()}
              >
                {lookingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Lookup
              </Button>
            </div>
            {errors.isbn && (
              <p className="text-xs text-destructive">{errors.isbn}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
            />
            {errors.author && (
              <p className="text-xs text-destructive">{errors.author}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select
                value={form.genre}
                onValueChange={(v) => set("genre", v as Genre)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.genres.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select
                value={form.condition}
                onValueChange={(v) => set("condition", v as Condition)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Second-hand">Second-hand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              value={form.publisher}
              onChange={(e) => set("publisher", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Shelf location</Label>
              <Select
                value={form.shelfLocation}
                onValueChange={(v) => set("shelfLocation", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.shelfLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                value={form.supplierId}
                onValueChange={(v) => set("supplierId", v)}
              >
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
              {errors.supplierId && (
                <p className="text-xs text-destructive">{errors.supplierId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qty">Qty on hand</Label>
              <Input
                id="qty"
                type="number"
                min={0}
                value={form.quantityOnHand}
                onChange={(e) => set("quantityOnHand", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder">Reorder point</Label>
              <Input
                id="reorder"
                type="number"
                min={0}
                value={form.reorderPoint}
                onChange={(e) => set("reorderPoint", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost price (AUD)</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                step="0.01"
                value={form.costPrice}
                onChange={(e) => set("costPrice", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retail">Retail price (AUD)</Label>
              <Input
                id="retail"
                type="number"
                min={0}
                step="0.01"
                value={form.retailPrice}
                onChange={(e) => set("retailPrice", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{book ? "Save changes" : "Add book"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
