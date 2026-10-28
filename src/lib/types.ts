export type Genre =
  | "Fiction"
  | "Kids"
  | "Non-fiction"
  | "Cookbooks"
  | "Crime"
  | "Fantasy"
  | "Local/Australian";

export type Condition = "New" | "Second-hand";

export type StockStatus = "in_stock" | "low" | "out";

export type MovementType = "stock_in" | "stock_out" | "adjustment";

export type StockOutReason =
  | "sale"
  | "damage"
  | "return_to_supplier"
  | "other";

export type StockInReason = "delivery" | "return_from_customer" | "other";

export type AdjustmentReason = "stocktake" | "correction" | "other";

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  contactName: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  genre: Genre;
  publisher: string;
  shelfLocation: string;
  quantityOnHand: number;
  reorderPoint: number;
  costPrice: number;
  retailPrice: number;
  supplierId: string;
  condition: Condition;
  dateAdded: string;
}

export interface SaleLine {
  bookId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  date: string;
  lines: SaleLine[];
  total: number;
}

export interface StockMovement {
  id: string;
  bookId: string;
  type: MovementType;
  quantity: number; // signed: + for in/adjust up, - for out/adjust down
  reason: string;
  notes?: string;
  date: string;
  relatedSaleId?: string;
  relatedSupplierId?: string;
  quantityBefore: number;
  quantityAfter: number;
}

export interface ReorderItem {
  bookId: string;
  suggestedQty: number;
  included: boolean;
}

export interface Settings {
  shopName: string;
  defaultReorderPoint: number;
  genres: Genre[];
  shelfLocations: string[];
  demoBannerDismissed: boolean;
}

export interface AppState {
  version: number;
  seededAt: string;
  settings: Settings;
  suppliers: Supplier[];
  books: Book[];
  sales: Sale[];
  movements: StockMovement[];
  reorderList: ReorderItem[];
}

export const STORE_VERSION = 1;
export const STORAGE_KEY = "shelfwise_demo_v1";

export const DEFAULT_GENRES: Genre[] = [
  "Fiction",
  "Kids",
  "Non-fiction",
  "Cookbooks",
  "Crime",
  "Fantasy",
  "Local/Australian",
];

export const DEFAULT_SHELF_LOCATIONS = [
  "A1-Front",
  "A2-Front",
  "A3-Front",
  "B1-Mid",
  "B2-Mid",
  "B3-Mid",
  "C1-Back",
  "C2-Back",
  "C3-Back",
  "Kids-Wall",
  "Window",
  "Counter",
];

export function getStockStatus(book: Book): StockStatus {
  if (book.quantityOnHand <= 0) return "out";
  if (book.quantityOnHand <= book.reorderPoint) return "low";
  return "in_stock";
}

export function suggestedOrderQty(book: Book): number {
  return Math.max(0, book.reorderPoint * 2 - book.quantityOnHand);
}
