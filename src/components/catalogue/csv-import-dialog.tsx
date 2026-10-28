"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  autoMapHeaders,
  CSV_COLUMNS,
  parseCsv,
  rowsToBookInputs,
  type CsvColumn,
} from "@/lib/csv";
import { importBooks } from "@/lib/store";
import { useStore } from "@/hooks/use-store";

export function CsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, suppliers } = useStore();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, CsvColumn | "">>({});

  const preview = useMemo(() => {
    if (!headers.length) return null;
    return rowsToBookInputs(headers, rows.slice(0, 5), mapping, {
      supplierId: suppliers[0]?.id ?? "",
      defaultReorderPoint: settings.defaultReorderPoint,
    });
  }, [headers, rows, mapping, suppliers, settings.defaultReorderPoint]);

  const reset = () => {
    setHeaders([]);
    setRows([]);
    setMapping({});
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      toast.error("CSV needs a header row and at least one data row");
      return;
    }
    const [headerRow, ...dataRows] = parsed;
    setHeaders(headerRow);
    setRows(dataRows);
    setMapping(autoMapHeaders(headerRow));
  };

  const handleImport = () => {
    const { books, errors } = rowsToBookInputs(headers, rows, mapping, {
      supplierId: suppliers[0]?.id ?? "",
      defaultReorderPoint: settings.defaultReorderPoint,
    });
    if (books.length === 0) {
      toast.error(errors[0] ?? "No valid rows to import");
      return;
    }
    const result = importBooks(books);
    toast.success(
      `Imported ${result.imported} new, updated ${result.updated}` +
        (errors.length ? ` (${errors.length} rows skipped)` : "")
    );
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import books from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV, map columns, preview the first rows, then import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">CSV file</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </div>

          {headers.length > 0 && (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">Column mapping</p>
                <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                  {headers.map((h) => (
                    <div key={h} className="flex items-center gap-2">
                      <span className="w-28 truncate text-xs text-muted-foreground">
                        {h}
                      </span>
                      <Select
                        value={mapping[h] || "__skip__"}
                        onValueChange={(v) =>
                          setMapping((m) => ({
                            ...m,
                            [h]: v === "__skip__" ? "" : (v as CsvColumn),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__skip__">Skip</SelectItem>
                          {CSV_COLUMNS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {preview && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Preview ({preview.books.length} of first 5 valid)
                  </p>
                  <div className="max-h-40 overflow-auto rounded-md border text-xs">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left">Title</th>
                          <th className="p-2 text-left">ISBN</th>
                          <th className="p-2 text-left">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.books.map((b, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{b.title}</td>
                            <td className="p-2 font-mono">{b.isbn}</td>
                            <td className="p-2">{b.quantityOnHand}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.errors.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      {preview.errors.length} issue(s) in preview rows
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!headers.length}>
            Import {rows.length ? `${rows.length} rows` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
