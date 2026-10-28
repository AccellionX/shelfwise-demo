"use client";

import { X } from "lucide-react";
import { dismissDemoBanner } from "@/lib/store";
import { useStore, useHydrated } from "@/hooks/use-store";

export function DemoBanner() {
  const hydrated = useHydrated();
  const { settings } = useStore();

  if (!hydrated || settings.demoBannerDismissed) return null;

  return (
    <div className="relative z-40 flex items-center justify-center gap-3 bg-primary px-4 py-2.5 text-center text-sm text-primary-foreground no-print">
      <p>
        Demo built for your shop by{" "}
        <span className="font-semibold">Musharaf</span> - sample data only
      </p>
      <button
        type="button"
        onClick={() => dismissDemoBanner()}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-white/10"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
