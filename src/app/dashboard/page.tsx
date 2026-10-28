"use client";

import {
  BookOpen,
  Boxes,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockStatusBadge } from "@/components/stock-status-badge";
import { EmptyState } from "@/components/empty-state";
import { useHydrated, useStore } from "@/hooks/use-store";
import { addToReorderList, getDashboardStats } from "@/lib/store";
import { formatAUD, formatShortDate } from "@/lib/format";
import { toast } from "sonner";

function KpiCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const hydrated = useHydrated();
  useStore(); // re-render on store updates

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const stats = getDashboardStats();
  const attention = [...stats.outOfStock, ...stats.lowStock];

  const handleAddToReorder = (bookId: string, title: string) => {
    addToReorderList(bookId);
    toast.success(`Added “${title}” to reorder list`);
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="How the shop is tracking: stock health and recent sales."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total titles"
          value={String(stats.totalTitles)}
          icon={BookOpen}
        />
        <KpiCard
          title="Units on hand"
          value={stats.totalUnits.toLocaleString("en-AU")}
          icon={Boxes}
        />
        <KpiCard
          title="Stock at cost"
          value={formatAUD(stats.stockValueCost)}
          icon={DollarSign}
        />
        <KpiCard
          title="Stock at retail"
          value={formatAUD(stats.stockValueRetail)}
          icon={TrendingUp}
        />
        <KpiCard
          title="Needs attention"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
          hint="Low + out of stock"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales - last 30 days</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total {formatAUD(stats.sales30Total)}
            </p>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd4c6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatShortDate(v)}
                  tick={{ fontSize: 11, fill: "#6b635a" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: "#6b635a" }}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => [
                    formatAUD(Number(value ?? 0)),
                    "Sales",
                  ]}
                  labelFormatter={(label) => formatShortDate(String(label))}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #ddd4c6",
                    background: "#fffcf7",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#1f4d3a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top sellers</CardTitle>
            <p className="text-sm text-muted-foreground">Last 30 days by units</p>
          </CardHeader>
          <CardContent>
            {stats.topSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <ul className="space-y-3">
                {stats.topSellers.map(({ book, qty }, i) => (
                  <li key={book.id} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {book.author}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {qty}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <p className="text-sm text-muted-foreground">
              Low stock and out of stock. Add to reorder in one click.
            </p>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="All stocked up"
                description="No titles are below their reorder point."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="divide-y divide-border">
                {attention.map((book) => (
                  <li
                    key={book.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {book.title}
                        </p>
                        <StockStatusBadge book={book} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {book.quantityOnHand} on hand · reorder at{" "}
                        {book.reorderPoint} · {book.shelfLocation}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToReorder(book.id, book.title)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to reorder
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slow movers</CardTitle>
            <p className="text-sm text-muted-foreground">
              On hand with no sale in 60+ days
            </p>
          </CardHeader>
          <CardContent>
            {stats.slowMovers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Everything has moved recently.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.slowMovers.map((book) => (
                  <li key={book.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {book.author} · {book.quantityOnHand} units ·{" "}
                        {formatAUD(book.retailPrice)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {book.shelfLocation}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
