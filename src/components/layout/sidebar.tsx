"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  ShoppingCart,
  ClipboardList,
  ScanLine,
  Settings,
  Menu,
  X,
  BookMarked,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useStore, useHydrated } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/catalogue", label: "Catalogue", icon: BookOpen },
  { href: "/movements", label: "Stock Movements", icon: ArrowLeftRight },
  { href: "/sale", label: "Quick Sale", icon: ShoppingCart },
  { href: "/reorder", label: "Reorder List", icon: ClipboardList },
  { href: "/stocktake", label: "Stocktake", icon: ScanLine },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { settings } = useStore();
  const [open, setOpen] = useState(false);

  const shopName = hydrated ? settings.shopName : "Harbour Lane Books";

  const NavLinks = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {nav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:hidden no-print">
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-semibold">Shelfwise</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden no-print">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-card shadow-xl">
            <div className="border-b border-border px-5 py-5">
              <div className="flex items-center gap-2">
                <BookMarked className="h-6 w-6 text-primary" />
                <span className="font-serif text-xl font-semibold">
                  Shelfwise
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {shopName}
              </p>
            </div>
            {NavLinks}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/80 no-print md:flex">
        <div className="border-b border-border px-5 py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-xl font-semibold leading-none">
                Shelfwise
              </div>
              <p className="mt-1 max-w-[140px] truncate text-xs text-muted-foreground">
                {shopName}
              </p>
            </div>
          </div>
        </div>
        {NavLinks}
        <div className="mt-auto border-t border-border px-4 py-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Inventory for independent bookshops
          </p>
        </div>
      </aside>
    </>
  );
}
