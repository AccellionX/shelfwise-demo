import type { BookInput } from "@/lib/store";
import type { Book, Condition, Genre } from "@/lib/types";

export const CSV_COLUMNS = [
  "isbn",
  "title",
  "author",
  "genre",
  "publisher",
  "shelfLocation",
  "quantityOnHand",
  "reorderPoint",
  "costPrice",
  "retailPrice",
  "supplierId",
  "condition",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function booksToCsv(books: Book[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = books.map((b) =>
    CSV_COLUMNS.map((col) => escapeCsv(b[col])).join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      if (ch === "\r") i++;
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

export function autoMapHeaders(headers: string[]): Record<string, CsvColumn | ""> {
  const mapping: Record<string, CsvColumn | ""> = {};
  const aliases: Record<CsvColumn, string[]> = {
    isbn: ["isbn", "isbn13", "isbn-13", "barcode"],
    title: ["title", "book title", "name"],
    author: ["author", "authors", "writer"],
    genre: ["genre", "category"],
    publisher: ["publisher", "pub"],
    shelfLocation: ["shelflocation", "shelf", "location", "shelf location"],
    quantityOnHand: ["quantityonhand", "qty", "quantity", "stock", "on hand"],
    reorderPoint: ["reorderpoint", "reorder", "reorder point", "min stock"],
    costPrice: ["costprice", "cost", "wholesale"],
    retailPrice: ["retailprice", "retail", "price", "rrp"],
    supplierId: ["supplierid", "supplier", "supplier id"],
    condition: ["condition", "cond"],
  };

  for (const header of headers) {
    const norm = header.toLowerCase().replace(/[_\s-]+/g, "");
    let matched: CsvColumn | "" = "";
    for (const col of CSV_COLUMNS) {
      const opts = aliases[col].map((a) => a.replace(/[_\s-]+/g, ""));
      if (opts.includes(norm) || norm === col.toLowerCase()) {
        matched = col;
        break;
      }
    }
    mapping[header] = matched;
  }
  return mapping;
}

export function rowsToBookInputs(
  headers: string[],
  dataRows: string[][],
  mapping: Record<string, CsvColumn | "">,
  defaults: { supplierId: string; defaultReorderPoint: number }
): { books: BookInput[]; errors: string[] } {
  const books: BookInput[] = [];
  const errors: string[] = [];

  const colIndex = (col: CsvColumn) =>
    headers.findIndex((h) => mapping[h] === col);

  dataRows.forEach((row, i) => {
    const get = (col: CsvColumn) => {
      const idx = colIndex(col);
      return idx >= 0 ? (row[idx] ?? "").trim() : "";
    };

    const title = get("title");
    const isbn = get("isbn").replace(/[-\s]/g, "");
    if (!title || !isbn) {
      errors.push(`Row ${i + 2}: missing title or ISBN`);
      return;
    }

    const qty = Number(get("quantityOnHand") || "0");
    const reorder = Number(get("reorderPoint") || String(defaults.defaultReorderPoint));
    const cost = Number(get("costPrice") || "0");
    const retail = Number(get("retailPrice") || "0");
    const conditionRaw = get("condition") || "New";
    const condition: Condition =
      conditionRaw.toLowerCase().includes("second") ? "Second-hand" : "New";

    books.push({
      isbn,
      title,
      author: get("author") || "Unknown",
      genre: (get("genre") || "Fiction") as Genre,
      publisher: get("publisher") || "Unknown",
      shelfLocation: get("shelfLocation") || "A1-Front",
      quantityOnHand: Number.isFinite(qty) ? qty : 0,
      reorderPoint: Number.isFinite(reorder) ? reorder : defaults.defaultReorderPoint,
      costPrice: Number.isFinite(cost) ? cost : 0,
      retailPrice: Number.isFinite(retail) ? retail : 0,
      supplierId: get("supplierId") || defaults.supplierId,
      condition,
    });
  });

  return { books, errors };
}
