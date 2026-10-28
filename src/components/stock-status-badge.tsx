import { Badge } from "@/components/ui/badge";
import { getStockStatus, type Book } from "@/lib/types";

export function StockStatusBadge({ book }: { book: Book }) {
  const status = getStockStatus(book);
  if (status === "out") {
    return <Badge variant="danger">Out</Badge>;
  }
  if (status === "low") {
    return <Badge variant="warning">Low</Badge>;
  }
  return <Badge variant="success">In stock</Badge>;
}
