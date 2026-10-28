"use client";

import { createSeedState } from "./seed";
import {
  AppState,
  Book,
  Condition,
  Genre,
  getStockStatus,
  ReorderItem,
  Sale,
  Settings,
  StockMovement,
  STORAGE_KEY,
  STORE_VERSION,
  suggestedOrderQty,
  Supplier,
} from "./types";
import { generateId, toISODate } from "./utils";

type Listener = () => void;

let memoryState: AppState | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function isBrowser() {
  return typeof window !== "undefined";
}

function loadFromStorage(): AppState | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== STORE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(state: AppState) {
  memoryState = state;
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  emit();
}

export function getState(): AppState {
  if (memoryState) return memoryState;
  const stored = loadFromStorage();
  if (stored) {
    memoryState = stored;
    return stored;
  }
  const seeded = createSeedState();
  persist(seeded);
  return seeded;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetDemoData(): AppState {
  const seeded = createSeedState();
  persist(seeded);
  return seeded;
}

function update(mutator: (state: AppState) => AppState) {
  const next = mutator(structuredClone(getState()));
  persist(next);
  return next;
}

// ── Settings ──────────────────────────────────────────────

export function updateSettings(partial: Partial<Settings>) {
  return update((s) => ({
    ...s,
    settings: { ...s.settings, ...partial },
  }));
}

export function dismissDemoBanner() {
  return updateSettings({ demoBannerDismissed: true });
}

export function addGenre(genre: Genre) {
  return update((s) => {
    if (s.settings.genres.includes(genre)) return s;
    return {
      ...s,
      settings: {
        ...s.settings,
        genres: [...s.settings.genres, genre],
      },
    };
  });
}

export function removeGenre(genre: Genre) {
  return update((s) => ({
    ...s,
    settings: {
      ...s.settings,
      genres: s.settings.genres.filter((g) => g !== genre),
    },
  }));
}

export function addShelfLocation(location: string) {
  return update((s) => {
    if (s.settings.shelfLocations.includes(location)) return s;
    return {
      ...s,
      settings: {
        ...s.settings,
        shelfLocations: [...s.settings.shelfLocations, location],
      },
    };
  });
}

export function removeShelfLocation(location: string) {
  return update((s) => ({
    ...s,
    settings: {
      ...s.settings,
      shelfLocations: s.settings.shelfLocations.filter((l) => l !== location),
    },
  }));
}

// ── Books ─────────────────────────────────────────────────

export type BookInput = Omit<Book, "id" | "dateAdded"> & {
  id?: string;
  dateAdded?: string;
};

export function upsertBook(input: BookInput): Book {
  let saved!: Book;
  update((s) => {
    if (input.id) {
      const idx = s.books.findIndex((b) => b.id === input.id);
      if (idx >= 0) {
        saved = { ...s.books[idx], ...input, id: input.id };
        const books = [...s.books];
        books[idx] = saved;
        return { ...s, books };
      }
    }
    saved = {
      ...input,
      id: input.id ?? generateId("book"),
      dateAdded: input.dateAdded ?? toISODate(new Date()),
    };
    return { ...s, books: [...s.books, saved] };
  });
  return saved;
}

export function deleteBook(bookId: string) {
  return update((s) => ({
    ...s,
    books: s.books.filter((b) => b.id !== bookId),
    reorderList: s.reorderList.filter((r) => r.bookId !== bookId),
  }));
}

export function importBooks(
  rows: BookInput[]
): { imported: number; updated: number } {
  let imported = 0;
  let updated = 0;
  update((s) => {
    const books = [...s.books];
    for (const row of rows) {
      const existingIdx = books.findIndex(
        (b) => b.isbn === row.isbn || (row.id && b.id === row.id)
      );
      if (existingIdx >= 0) {
        books[existingIdx] = {
          ...books[existingIdx],
          ...row,
          id: books[existingIdx].id,
          dateAdded: books[existingIdx].dateAdded,
        };
        updated++;
      } else {
        books.push({
          ...row,
          id: generateId("book"),
          dateAdded: row.dateAdded ?? toISODate(new Date()),
        });
        imported++;
      }
    }
    return { ...s, books };
  });
  return { imported, updated };
}

// ── Stock movements ───────────────────────────────────────

export function addStockMovement(input: {
  bookId: string;
  type: StockMovement["type"];
  quantity: number; // signed
  reason: string;
  notes?: string;
  relatedSaleId?: string;
  relatedSupplierId?: string;
  date?: string;
}): StockMovement {
  let movement!: StockMovement;
  update((s) => {
    const bookIdx = s.books.findIndex((b) => b.id === input.bookId);
    if (bookIdx < 0) throw new Error("Book not found");
    const book = s.books[bookIdx];
    const before = book.quantityOnHand;
    const after = Math.max(0, before + input.quantity);
    movement = {
      id: generateId("mov"),
      bookId: input.bookId,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
      notes: input.notes,
      date: input.date ?? toISODate(new Date()),
      relatedSaleId: input.relatedSaleId,
      relatedSupplierId: input.relatedSupplierId,
      quantityBefore: before,
      quantityAfter: after,
    };
    const books = [...s.books];
    books[bookIdx] = { ...book, quantityOnHand: after };

    // Keep reorder list in sync
    let reorderList = [...s.reorderList];
    const status = getStockStatus(books[bookIdx]);
    const existing = reorderList.findIndex((r) => r.bookId === input.bookId);
    if (status === "low" || status === "out") {
      const suggested = suggestedOrderQty(books[bookIdx]);
      if (existing >= 0) {
        reorderList[existing] = {
          ...reorderList[existing],
          suggestedQty: suggested,
        };
      } else {
        reorderList.push({
          bookId: input.bookId,
          suggestedQty: suggested,
          included: true,
        });
      }
    } else if (existing >= 0) {
      reorderList = reorderList.filter((r) => r.bookId !== input.bookId);
    }

    return {
      ...s,
      books,
      movements: [...s.movements, movement],
      reorderList,
    };
  });
  return movement;
}

export function applyStocktakeAdjustments(
  counts: { bookId: string; countedQty: number }[]
): number {
  let applied = 0;
  for (const row of counts) {
    const state = getState();
    const book = state.books.find((b) => b.id === row.bookId);
    if (!book) continue;
    const delta = row.countedQty - book.quantityOnHand;
    if (delta === 0) continue;
    addStockMovement({
      bookId: row.bookId,
      type: "adjustment",
      quantity: delta,
      reason: "stocktake",
      notes: `Stocktake: expected ${book.quantityOnHand}, counted ${row.countedQty}`,
    });
    applied++;
  }
  return applied;
}

// ── Sales ─────────────────────────────────────────────────

export function completeSale(
  lines: { bookId: string; quantity: number; unitPrice: number }[]
): Sale {
  if (lines.length === 0) throw new Error("Cart is empty");

  let sale!: Sale;
  update((s) => {
    // Validate stock
    for (const line of lines) {
      const book = s.books.find((b) => b.id === line.bookId);
      if (!book) throw new Error("Book not found");
      if (book.quantityOnHand < line.quantity) {
        throw new Error(`Insufficient stock for "${book.title}"`);
      }
    }

    const saleId = generateId("sale");
    const date = toISODate(new Date());
    const total =
      Math.round(
        lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0) * 100
      ) / 100;

    sale = { id: saleId, date, lines, total };

    let books = [...s.books];
    const newMovements: StockMovement[] = [];
    let reorderList = [...s.reorderList];

    for (const line of lines) {
      const idx = books.findIndex((b) => b.id === line.bookId);
      const book = books[idx];
      const before = book.quantityOnHand;
      const after = before - line.quantity;
      books[idx] = { ...book, quantityOnHand: after };

      newMovements.push({
        id: generateId("mov"),
        bookId: line.bookId,
        type: "stock_out",
        quantity: -line.quantity,
        reason: "sale",
        date,
        relatedSaleId: saleId,
        quantityBefore: before,
        quantityAfter: after,
      });

      const status = getStockStatus(books[idx]);
      const existing = reorderList.findIndex((r) => r.bookId === line.bookId);
      if (status === "low" || status === "out") {
        const suggested = suggestedOrderQty(books[idx]);
        if (existing >= 0) {
          reorderList[existing] = {
            ...reorderList[existing],
            suggestedQty: suggested,
          };
        } else {
          reorderList.push({
            bookId: line.bookId,
            suggestedQty: suggested,
            included: true,
          });
        }
      }
    }

    return {
      ...s,
      books,
      sales: [...s.sales, sale],
      movements: [...s.movements, ...newMovements],
      reorderList,
    };
  });
  return sale;
}

// ── Reorder list ──────────────────────────────────────────

export function addToReorderList(bookId: string) {
  return update((s) => {
    if (s.reorderList.some((r) => r.bookId === bookId)) return s;
    const book = s.books.find((b) => b.id === bookId);
    if (!book) return s;
    return {
      ...s,
      reorderList: [
        ...s.reorderList,
        {
          bookId,
          suggestedQty: suggestedOrderQty(book),
          included: true,
        },
      ],
    };
  });
}

export function updateReorderItem(
  bookId: string,
  partial: Partial<Omit<ReorderItem, "bookId">>
) {
  return update((s) => ({
    ...s,
    reorderList: s.reorderList.map((r) =>
      r.bookId === bookId ? { ...r, ...partial } : r
    ),
  }));
}

export function removeFromReorderList(bookId: string) {
  return update((s) => ({
    ...s,
    reorderList: s.reorderList.filter((r) => r.bookId !== bookId),
  }));
}

export function refreshReorderSuggestions() {
  return update((s) => {
    const items: ReorderItem[] = s.books
      .filter((b) => b.quantityOnHand <= b.reorderPoint)
      .map((b) => {
        const existing = s.reorderList.find((r) => r.bookId === b.id);
        return {
          bookId: b.id,
          suggestedQty: existing?.suggestedQty ?? suggestedOrderQty(b),
          included: existing?.included ?? true,
        };
      });
    return { ...s, reorderList: items };
  });
}

export function markReorderReceived(
  items: { bookId: string; quantity: number; supplierId: string }[]
) {
  for (const item of items) {
    if (item.quantity <= 0) continue;
    addStockMovement({
      bookId: item.bookId,
      type: "stock_in",
      quantity: item.quantity,
      reason: "delivery",
      notes: "Marked received from purchase order",
      relatedSupplierId: item.supplierId,
    });
    removeFromReorderList(item.bookId);
  }
}

// ── Selectors / helpers ───────────────────────────────────

export function getBook(bookId: string): Book | undefined {
  return getState().books.find((b) => b.id === bookId);
}

export function getSupplier(supplierId: string): Supplier | undefined {
  return getState().suppliers.find((s) => s.id === supplierId);
}

export function findBooksByQuery(query: string): Book[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getState().books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.includes(q.replace(/[-\s]/g, ""))
  );
}

export function getDashboardStats() {
  const { books, sales } = getState();
  const totalTitles = books.length;
  const totalUnits = books.reduce((sum, b) => sum + b.quantityOnHand, 0);
  const stockValueCost = books.reduce(
    (sum, b) => sum + b.quantityOnHand * b.costPrice,
    0
  );
  const stockValueRetail = books.reduce(
    (sum, b) => sum + b.quantityOnHand * b.retailPrice,
    0
  );
  const lowStock = books.filter((b) => getStockStatus(b) === "low");
  const outOfStock = books.filter((b) => getStockStatus(b) === "out");

  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sales30 = sales.filter((s) => new Date(s.date).getTime() >= cutoff30);

  // Daily totals for chart
  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const sale of sales30) {
    const key = sale.date.slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) ?? 0) + sale.total);
    }
  }
  const salesChart = Array.from(byDay.entries()).map(([date, total]) => ({
    date,
    total: Math.round(total * 100) / 100,
  }));

  // Top 5 sellers (last 30 days by qty)
  const soldQty = new Map<string, number>();
  for (const sale of sales30) {
    for (const line of sale.lines) {
      soldQty.set(line.bookId, (soldQty.get(line.bookId) ?? 0) + line.quantity);
    }
  }
  const topSellers = Array.from(soldQty.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([bookId, qty]) => ({
      book: books.find((b) => b.id === bookId)!,
      qty,
    }))
    .filter((x) => x.book);

  // Slow movers: no sale in 60+ days
  const cutoff60 = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const recentlySold = new Set<string>();
  for (const sale of sales) {
    if (new Date(sale.date).getTime() >= cutoff60) {
      for (const line of sale.lines) recentlySold.add(line.bookId);
    }
  }
  const slowMovers = books
    .filter((b) => b.quantityOnHand > 0 && !recentlySold.has(b.id))
    .slice(0, 8);

  return {
    totalTitles,
    totalUnits,
    stockValueCost,
    stockValueRetail,
    lowStockCount: lowStock.length + outOfStock.length,
    lowStock,
    outOfStock,
    salesChart,
    topSellers,
    slowMovers,
    sales30Total: sales30.reduce((sum, s) => sum + s.total, 0),
  };
}

export type { Book, Condition, Genre, Sale, Settings, StockMovement, Supplier };
