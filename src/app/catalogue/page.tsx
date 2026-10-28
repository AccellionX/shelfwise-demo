"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { StockStatusBadge } from "@/components/stock-status-badge";
import { EmptyState } from "@/components/empty-state";
import { BookFormDrawer } from "@/components/catalogue/book-form-drawer";
import { CsvImportDialog } from "@/components/catalogue/csv-import-dialog";
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
import { deleteBook } from "@/lib/store";
import { booksToCsv, downloadCsv } from "@/lib/csv";
import { formatAUD, formatDate } from "@/lib/format";
import { getStockStatus, type Book, type StockStatus } from "@/lib/types";

export default function CataloguePage() {
  const hydrated = useHydrated();
  const { books, settings } = useStore();

  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [condition, setCondition] = useState<string>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<Book | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[-\s]/g, "");
    return books
      .filter((b) => {
        if (q) {
          const hay = `${b.title} ${b.author} ${b.isbn}`.toLowerCase();
          if (!hay.replace(/[-\s]/g, "").includes(q) && !hay.includes(query.trim().toLowerCase())) {
            return false;
          }
        }
        if (genre !== "all" && b.genre !== genre) return false;
        if (location !== "all" && b.shelfLocation !== location) return false;
        if (condition !== "all" && b.condition !== condition) return false;
        if (status !== "all") {
          const s = getStockStatus(b);
          if (s !== (status as StockStatus)) return false;
        }
        return true;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [books, query, genre, location, status, condition]);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditing(book);
    setDrawerOpen(true);
  };

  const handleExport = () => {
    downloadCsv("shelfwise-catalogue.csv", booksToCsv(filtered));
    toast.success(`Exported ${filtered.length} titles`);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteBook(deleting.id);
    toast.success(`Removed “${deleting.title}”`);
    setDeleting(null);
  };

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Catalogue"
        description={`${books.length} titles in the shop`}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add book
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search title, author, ISBN…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger>
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genres</SelectItem>
              {settings.genres.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {settings.shelfLocations.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="in_stock">In stock</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="out">Out</SelectItem>
            </SelectContent>
          </Select>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All conditions</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Second-hand">Second-hand</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books match"
          description="Try clearing filters or add a new title."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add book
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Retail</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {book.author} · {book.isbn}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{book.genre}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {book.shelfLocation}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {book.quantityOnHand}
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge book={book} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAUD(book.retailPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(book)}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(book)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((book) => (
              <Card key={book.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">{book.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {book.author}
                      </p>
                    </div>
                    <StockStatusBadge book={book} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{book.genre}</span>
                    <span className="font-mono">{book.shelfLocation}</span>
                    <span>{book.quantityOnHand} on hand</span>
                    <span>{formatAUD(book.retailPrice)}</span>
                    <span>Added {formatDate(book.dateAdded)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(book)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleting(book)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            Showing {filtered.length} of {books.length} titles
          </p>
        </>
      )}

      <BookFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        book={editing}
      />
      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this book?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be removed from the catalogue. This cannot
              be undone (unless you reset demo data).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
